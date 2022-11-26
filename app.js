(function () {
    const { Component, mount, xml, useRef, onMounted, useState, reactive, useEnv } = owl;
  
    // -------------------------------------------------------------------------
    // Store
    // -------------------------------------------------------------------------
    function useStore() {
      const env = useEnv();
      return useState(env.store);
    }
  
    // -------------------------------------------------------------------------
    // TaskList
    // -------------------------------------------------------------------------
    class TaskList {
      constructor(tasks) {
        this.tasks = tasks || [];
        const taskIds = this.tasks.map((t) => t.id);
        this.nextId = taskIds.length ? Math.max(...taskIds) + 1 : 1;
      }
  
      addTask(text) {
        text = text.trim();
        if (text) {
          const task = {
            id: this.nextId++,
            text: text,
            isCompleted: false,
          };
          this.tasks.push(task);
        }
      }
  
      toggleTask(task) {
        task.isCompleted = !task.isCompleted;
      }
  
      deleteTask(task) {
        const index = this.tasks.findIndex((t) => t.id === task.id);
        this.tasks.splice(index, 1);
      }
    }
  
    function createTaskStore() {
      const saveTasks = () => localStorage.setItem("todoapp", JSON.stringify(taskStore.tasks));
      const initialTasks = JSON.parse(localStorage.getItem("todoapp") || "[]");
      const taskStore = reactive(new TaskList(initialTasks), saveTasks);
      saveTasks();
      return taskStore;
    }
  
    // -------------------------------------------------------------------------
    // Task Component
    // -------------------------------------------------------------------------
    class Task extends Component {
      static template = xml/* xml */ `
        <div class="task" t-att-class="props.task.isCompleted ? 'done' : ''">
          <input type="checkbox"
            t-att-id="props.task.id"
            t-att-checked="props.task.isCompleted"
            t-on-click="() => store.toggleTask(props.task)"/>
          <label t-att-for="props.task.id"><t t-esc="props.task.text"/></label>
          <span class="delete" t-on-click="() => store.deleteTask(props.task)">🗑</span>
        </div>`;
  
      static props = ["task"];
  
      setup() {
        this.store = useStore();
      }
    }
  
    // -------------------------------------------------------------------------
    // Root Component
    // -------------------------------------------------------------------------
    class Root extends Component {
      static template = xml/* xml */ `
        <div class="todo-app">
          <input placeholder="Enter a new task" t-on-keyup="addTask" t-ref="add-input"/>
          <div class="task-list">
            <t t-foreach="displayedTasks" t-as="task" t-key="task.id">
              <Task task="task"/>
            </t>
          </div>
          <div class="task-panel" t-if="store.tasks.length">
            <div class="task-counter">
              <t t-esc="displayedTasks.length"/>
              <t t-if="displayedTasks.length lt store.tasks.length">
                  / <t t-esc="store.tasks.length"/>
              </t>
              task(s)
            </div>
            <div>
              <span t-foreach="['all', 'active', 'completed']"
                t-as="f" t-key="f"
                t-att-class="{active: filter.value===f}"
                t-on-click="() => this.setFilter(f)"
                t-esc="f"/>
            </div>
          </div>
        </div>`;
      static components = { Task };
  
      setup() {
        const inputRef = useRef("add-input");
        onMounted(() => inputRef.el.focus());
        this.store = useStore();
        this.filter = useState({ value: "all" });
      }
  
      addTask(ev) {
        // 13 is keycode for ENTER
        if (ev.keyCode === 13) {
          this.store.addTask(ev.target.value);
          ev.target.value = "";
        }
      }
  
      get displayedTasks() {
        const tasks = this.store.tasks;
        switch (this.filter.value) {
          case "active":
            return tasks.filter((t) => !t.isCompleted);
          case "completed":
            return tasks.filter((t) => t.isCompleted);
          case "all":
            return tasks;
        }
      }
  
      setFilter(filter) {
        this.filter.value = filter;
      }
    }
  
    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------
    const env = { store: createTaskStore() };
    mount(Root, document.body, { dev: true, env });
  })();