// Component Base Class => A class that manages all the shared functionalities which the classes that renders things to the DOM have in common.
export default abstract class Component<T extends HTMLElement, U extends HTMLElement> { // Think of this as UI components that we render to the screen. Abstract class because it should never be directly instantiated, instead, it should always be used for inheritance.
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