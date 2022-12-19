class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;

    constructor() {
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true); // With this, we import the template element into the DOM. The second argument defines whether we should import this with a deep clone or not.
        this.element = importedNode.firstElementChild as HTMLFormElement; // Getting access to the form element.
        this.attach();
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element); // Insert right at the beginning of the opening tag
    }
}

const projectInput = new ProjectInput;