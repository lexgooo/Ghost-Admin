import BaseValidator from './base';
import PasswordValidatorMixin from './mixins/password';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

const userValidator = BaseValidator.extend(PasswordValidatorMixin, {
    init() {
        this.properties = this.properties || ['name', 'bio', 'email', 'location', 'website', 'roles'];
        this._super(...arguments);
    },

    isActive(model) {
        return (model.get('status') === 'active');
    },

    name(model) {
        let name = model.get('name');

        if (this.isActive(model)) {
            if (isBlank(name)) {
                model.get('errors').add('name', '请输入名称。');
                this.invalidate();
            } else if (!validator.isLength(name, 0, 191)) {
                model.get('errors').add('name', '名字太长了');
                this.invalidate();
            }
        }
    },

    bio(model) {
        let bio = model.get('bio');

        if (this.isActive(model)) {
            if (!validator.isLength(bio || '', 0, 200)) {
                // model.get('errors').add('bio', 'Bio is too long');
                model.get('errors').add('bio', 'Bio 太长了');
                this.invalidate();
            }
        }
    },

    email(model) {
        let email = model.get('email');

        if (!validator.isEmail(email || '')) {
            model.get('errors').add('email', '请提供有效的电子邮件地址');
            this.invalidate();
        }

        if (!validator.isLength(email || '', 0, 191)) {
            model.get('errors').add('email', '邮箱地址太长了');
            this.invalidate();
        }
    },

    location(model) {
        let location = model.get('location');

        if (this.isActive(model)) {
            if (!validator.isLength(location || '', 0, 150)) {
                model.get('errors').add('location', 'Location is too long');
                this.invalidate();
            }
        }
    },

    website(model) {
        let website = model.get('website');
        // eslint-disable-next-line camelcase
        let isInvalidWebsite = !validator.isURL(website || '', {require_protocol: false})
                          || !validator.isLength(website || '', 0, 2000);

        if (this.isActive(model)) {
            if (!isBlank(website) && isInvalidWebsite) {
                model.get('errors').add('website', '网站地址无效');
                this.invalidate();
            }
        }
    },

    roles(model) {
        if (!this.isActive(model)) {
            let roles = model.get('roles');

            if (roles.length < 1) {
                model.get('errors').add('role', '请选择一个角色');
                this.invalidate();
            }
        }
    },

    passwordChange(model) {
        let newPassword = model.get('newPassword');
        let ne2Password = model.get('ne2Password');

        // validation only marks the requested property as validated so we
        // have to add properties manually
        model.get('hasValidated').addObject('newPassword');
        model.get('hasValidated').addObject('ne2Password');

        if (isBlank(newPassword) && isBlank(ne2Password)) {
            model.get('errors').add('newPassword', '抱歉，密码不能为空');
            this.invalidate();
        } else {
            if (!validator.equals(newPassword, ne2Password || '')) {
                model.get('errors').add('ne2Password', '你的新密码不匹配');
                this.invalidate();
            }

            this.passwordValidation(model, newPassword, 'newPassword');
        }
    },

    ownPasswordChange(model) {
        let oldPassword = model.get('password');

        this.passwordChange(model);

        // validation only marks the requested property as validated so we
        // have to add properties manually
        model.get('hasValidated').addObject('password');

        if (isBlank(oldPassword)) {
            model.get('errors').add('password', '您需要设置当前密码才能设置新密码');
            this.invalidate();
        }
    }
});

export default userValidator.create();
