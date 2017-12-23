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
    data: LoginResult | CourseResult | QuizResult;
}

export class LoginResult {
    constructor(public id: number, public level: UserLevel) {
    }
}

export class CourseResult {
    constructor(public id: string, public name: string, public topics?: Topic[], public quizs?: Quiz[]) {
    }
}

export class QuizResult {
    constructor(public id: string, public name: string, public questions: Question[]) {
    }
}

export class Topic {
    constructor(public id: string, public name: string, public description: string, public files?: File[]) {
    }
}

export class Question {
    constructor(public id: string, public question: string, public answers: string[]) {
    }
}

export class Quiz {
    constructor(public id: string, public name: string) {
    }
}

export class File {
    constructor(public id: string, public name: string, public link: string) {
    }
}
