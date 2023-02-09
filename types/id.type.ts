import { Type } from '@mikro-orm/core';
import { Id } from './id';

export class IdType extends Type<Id, string> {
    override convertToDatabaseValue(value: any) {
        if (value instanceof Id) {
            return value.value;
        }

        return value;
    }

    override convertToJSValue(value: any) {
        if (typeof value === 'string') {
            const id = Object.create(Id.prototype);

            return Object.assign(id, {
                value,
            });
        }

        return value;
    }

    override compareAsType() {
        return 'string';
    }

    override getColumnType() {
        return 'text';
    }
}
