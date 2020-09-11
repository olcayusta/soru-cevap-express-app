export interface User {
    readonly id: number;
    email: string;
    password: string
    displayName: string;
    picture: string;
    signupDate: Date;
}
