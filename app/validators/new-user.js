import BaseValidator from './base';
import PasswordValidatorMixin from './mixins/password';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default BaseValidator.extend(PasswordValidatorMixin, {
    init() {
        this.properties = this.properties || ['name', 'email', 'password'];
        this._super(...arguments);
    },

    name(model) {
        let name = model.get('name');

        if (!validator.isLength(name || '', 1)) {
            model.get('errors').add('name', '请输入名称。');
            model.get('hasValidated').addObject('email');
            this.invalidate();
        }
    },

    email(model) {
        let email = model.get('email');

        if (isBlank(email)) {
            model.get('errors').add('email', '请输入邮箱地址。');
            this.invalidate();
        } else if (!validator.isEmail(email)) {
            model.get('errors').add('email', '邮箱地址不合规');
            this.invalidate();
        }

        model.get('hasValidated').addObject('email');
    },

    password(model) {
        this.passwordValidation(model);
    }
});
