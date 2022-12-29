// Drag and Drop Interfaces
interface Draggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}

// Project Type
enum ProjectStatus { Active, Finished } // Using enum here becuase we have exactly 2 options and we only need identifiers instead of strings

class Project { // Using a class to create the Project type here instead of an interface or a custom type because we want to be able to instantiate it.
    constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) { }
}

// Project State Management Class: Takes care of the state of the application, set up listeners in the different parts of the app that might be interested.

type Listener<T> = (items: T[]) => void // Using a type here because we want to encode a function type with one word. Listener is just a bunch of functions and we execute that when anything changes. Since it's a function we have to declare a return type which is void.

class State<T> {
    protected listeners: Listener<T>[] = []; // Set up a subscription pattern that manages a list of listeners(functions) inside of the project state. Functions called whenever something changes

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}
class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor() { // Creating a private constructor here guarantees that this is a singleton class.
        super();
    }

    static getInstance() { // Creating a new instance of ProjectState
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, numberOfPeople: number) {
        const newProject = new Project(Math.random().toString(), title, description, numberOfPeople, ProjectStatus.Active)
        this.projects.push(newProject);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice()); // Calling slice() makes sure we only return a copy of the array and not the original array. Because of arrays are passed by reference in JS
        }
    }
}

// Creating a Global Instance of Projects State. By doing this, we can now communicate with the class from anywhere in the app, even though the class is private.
const projectState = ProjectState.getInstance(); // With this we're guaranteed we're only working with the exact same object and we always have only one object of that type in the entire application.

// Validation
interface Validatable {
    value: string | number;
    required?: boolean; // ? in front of the properties denotes that these vales should all be optional
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

const validate = (validatableInput: Validatable) => {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (validatableInput.minLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}

// AutoBind Decorator
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjustedDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjustedDescriptor;
}


// Component Base Class => A class that manages all the shared functionalities which the classes that renders things to the DOM have in common.
abstract class Component<T extends HTMLElement, U extends HTMLElement> { // Think of this as UI components that we render to the screen. Abstract class because it should never be directly instantiated, instead, it should always be used for inheritance.
    // We can use a Generic class here so we can set the concrete types when we inherit from it.
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) { // We need to know the ID of the template so we can know how to select it. We need to know the hostElementID so we can know where to render this component. We need to know the newElementId so that we get an ID that has to be assigned to the newly rendered element.
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;

        const importedNode = document.importNode(this.templateElement.content, true); // With this, we import the template element into the DOM. The second argument defines whether we should import this with a deep clone or not.
        this.element = importedNode.firstElementChild as U; // Getting access to the form element.
        if (newElementId) {
            this.element.id = newElementId;
        }

        this.attach(insertAtStart);
    }

    private attach(insertAtStart: boolean) {
        this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element);
    }

    // Added as ABSTRACT methods which means the complete implementation is mising here, but we now force any class inheriting from this Component class to have these two methods available to them.
    abstract configure(): void;
    abstract renderContent(): void;
}

// ProjectItem Class
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
    private project: Project;

    get persons() {
        if (this.project.people === 1) {
            return '1 person';
        } else {
            return `${this.project.people} persons`;
        }
    }

    constructor(hostId: string, project: Project) {
        super('single-project', hostId, false, project.id);
        this.project = project;

        this.configure();
        this.renderContent();
    }

    @autobind // We're @autobind here to make sure that "this" keyword refers to the ProjectItem class, which will not be the case by default
    dragStartHandler(event: DragEvent) {
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    dragEndHandler(_: DragEvent) {
        console.log('DragEnd');
    }

    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
    }

    renderContent() {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }
}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished') {
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    @autobind
    dragOverHandler(event: DragEvent) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }
    }

    dropHandler(event: DragEvent) {
        console.log(event.dataTransfer!.getData('text/plain'));
    }

    @autobind
    dragLeaveHandler(_: DragEvent) {
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }

    configure() {
        // Add a listener to make sure that the dragOverHandler is actually fired
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        projectState.addListener((projects: Project[]) => { // Reach out to projectState and call addListener on it to register a listener function. listeners in the end is just a list of functions which we'll eventually call when something changes.
            // Before we store the projects and render them we wanna filter them, to know which ones are active and finished respectively
            const relevantProjects = projects.filter(project => {
                if (this.type === 'active') {
                    return project.status === ProjectStatus.Active;
                }
                return project.status === ProjectStatus.Finished;
            });

            this.assignedProjects = relevantProjects; // Once something changes, override the assignedProjects with the new projects because something changed in the state.
            this.renderProjects();
        });
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private renderProjects() {
        const listElement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listElement.innerHTML = ''; // We get the rid of all list items and then re-render. This prevents re-rendering of the old items in the list which led to some item being rendered twice
        for (const projectItem of this.assignedProjects) {
            new ProjectItem(this.element.querySelector('ul')!.id, projectItem);
        }
    }
}


// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        // Here we import the templateElement into the DOM.
        super('project-input', 'app', true, 'user-input');

        // Getting Access to all the input fields of the form, selecting them with the id attribute.
        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.configure();
    }

    configure() {
        this.element.addEventListener('submit', this.submitHandler);
    }

    renderContent() { }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
        }

        const descriptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        }

        const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if (!validate(titleValidatable) || !validate(descriptionValidatable) || !validate(peopleValidatable)) {
            alert('Invalid input, please try again');
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }

    private clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();

        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            projectState.addProject(title, description, people);
            this.clearInputs();
        }
    }
}

const projectInput = new ProjectInput;
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');