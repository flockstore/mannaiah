import { ClassConstructor } from 'class-transformer';
export declare function validateUtil<T extends object>(cls: ClassConstructor<T>, config: Record<string, unknown>): T;
