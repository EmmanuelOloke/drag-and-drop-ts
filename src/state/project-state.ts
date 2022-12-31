import { Project, ProjectStatus } from "../models/project";

// Project State Management Class: Takes care of the state of the application, set up listeners in the different parts of the app that might be interested.

type Listener<T> = (items: T[]) => void // Using a type here because we want to encode a function type with one word. Listener is just a bunch of functions and we execute that when anything changes. Since it's a function we have to declare a return type which is void.

class State<T> {
    protected listeners: Listener<T>[] = []; // Set up a subscription pattern that manages a list of listeners(functions) inside of the project state. Functions called whenever something changes

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

export class ProjectState extends State<Project> {
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
        this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
        const project = this.projects.find(project => project.id === projectId);
        if (project && project.status !== newStatus) {
            project.status = newStatus;
            this.updateListeners();
        }
    }

    private updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice()); // Calling slice() makes sure we only return a copy of the array and not the original array. Because arrays are passed by reference in JS
        }
    }
}

// Creating a Global Instance of Projects State. By doing this, we can now communicate with the class from anywhere in the app, even though the class is private.
export const projectState = ProjectState.getInstance(); // With this we're guaranteed we're only working with the exact same object and we always have only one object of that type in the entire application.