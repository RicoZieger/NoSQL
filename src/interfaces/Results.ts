export enum Status {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE'
}

export enum UserLevel {
    STUDENT = 'STUDENT',
    PROFESSOR = 'PROFESSOR'
}

export interface Message {
    status: Status;
    data: LoginResult | CourseResult;
}

export class LoginResult {
    constructor(public id: number, public level: UserLevel) {
    }
}

export class CourseResult {
    constructor(public id: number, public name: string, public topics?: Topic[], public tests?: Test[]) {
    }
}

export class Topic {
    constructor(public id: number, public name: string, public description: string, public files?: File[]) {
    }
}

export class Test {
    constructor(public id: number, public name: string) {
    }
}

export class File {
    constructor(public id: number, public name: string, public link: string) {
    }
}