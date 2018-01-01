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
    data: LoginResult | CourseResult | Quiz | CourseMetadata | QuizUserResult;
}

export class LoginResult {
    constructor(public _id: string, public level: UserLevel) {
    }
}

export class CourseResult {
    constructor(public _id: string, public name: string, public topics?: Topic[], public quizs?: QuizMetadata[]) {
    }
}

export class Topic {
    constructor(public _id: string, public name: string, public description: string, public files?: FileMetadata[]) {
    }
}

export class FileMetadata {
    constructor(public _id: string, public name: string, public link: string) {
    }
}

export class QuizMetadata {
    constructor(public _id: string, public name: string) {
    }
}

export class Quiz {
    constructor(public _id: string, public name: string, public questions: Question[]) {
    }
}

export class Question {
    constructor(public _id: string, public question: string, public answers: string[]) {
    }
}

export class QuizResult{
    constructor(public quizId: string, public answers: UserAnswer[]){
    }
}

export class UserAnswer{
    constructor(public questionId: string, public givenAnswerIndizies: number[]){
    }
}

export class CourseMetadata{
    constructor(public _id: string, public name: string){
    }
}

export class QuizUserResult{
    constructor(public user_id: string, public points: string){
    }
}
