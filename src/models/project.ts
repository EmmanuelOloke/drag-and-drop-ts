// Project Type
export enum ProjectStatus { Active, Finished } // Using enum here becuase we have exactly 2 options and we only need identifiers instead of strings

export class Project { // Using a class to create the Project type here instead of an interface or a custom type because we want to be able to instantiate it.
    constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) { }
}
