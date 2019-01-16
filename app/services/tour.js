import Evented from '@ember/object/evented';
import RSVP from 'rsvp';
import Service, {inject as service} from '@ember/service';
import {computed} from '@ember/object';

export default Service.extend(Evented, {

    ghostPaths: service(),
    session: service(),

    // this service is responsible for managing tour item visibility and syncing
    // the viewed state with the server
    //
    // tour items need to be centrally defined here so that we have a single
    // source of truth for marking all tour items as viewed
    //
    // a {{gh-tour-item "unique-id"}} component can be inserted in any template,
    // this will use the tour service to grab content and determine visibility
    // with the component in control of rendering the throbber/controlling the
    // modal - this allows the component lifecycle hooks to perform automatic
    // display/cleanup when the relevant UI is visible.

    viewed: null,

    // IDs should **NOT** be changed if they have been part of a release unless
    // the re-display of the throbber should be forced. In that case it may be
    // useful to add a version number eg. `my-feature` -> `my-feature-v2`.
    // Format is as follows:
    //
    // {
    //     id: 'test',
    //     title: 'This is a test',
    //     message: 'This is a test of our <strong>feature tour</strong> feature'
    // }
    //
    // TODO: it may be better to keep this configuration elsewhere to keep the
    // service clean. Eventually we'll want apps to be able to register their
    // own throbbers and tour content
    throbbers: null,

    init() {
        this._super(...arguments);
        let adminUrl = `${window.location.origin}${this.get('ghostPaths.url').admin()}`;
        let adminDisplayUrl = adminUrl.replace(`${window.location.protocol}//`, '');

        this.viewed = [];

        this.throbbers = [{
            id: 'getting-started',
            title: 'Ghost入门',
            message: `这是您的管理区域！ 您可以在此处找到所有内容，用户和设置。 您可以随时访问 <a href="${adminUrl}" target="_blank">${adminDisplayUrl}</a>`
        }, {
            id: 'using-the-editor',
            title: '使用Ghost编辑器',
            message: 'Ghost使用Markdown允许您快速轻松地编写和格式化内容。 这个工具栏也有帮助！ 点击<strong>？</ strong>图标可获得更多编辑器快捷方式。'
        }, {
            id: 'static-post',
            title: '将文章转换成页面',
            message: '静态页面是永久性的内容，它们位于您常用的文章流之外，例如“关于”或“联系人”页面。'
        }, {
            id: 'featured-post',
            title: '设置精选文章',
            message: '根据您的主题，精选文章会获得特殊的样式，使其成为一个特别重要或强调的故事。'
        }, {
            id: 'upload-a-theme',
            title: '自定义你发布的文章',
            message: '使用自定义主题，您可以完全控制网站的外观，以适合您的分支。 这是一个完整的帮助指南： <strong><a href="https://themes.ghost.org" target="_blank">https://themes.ghost.org</a></strong>'
        }];
    },

    _activeThrobbers: computed('viewed.[]', 'throbbers.[]', function () {
        // return throbbers that haven't been viewed
        let viewed = this.get('viewed');
        let throbbers = this.get('throbbers');

        return throbbers.reject(throbber => viewed.includes(throbber.id));
    }),

    // retrieve the IDs of the viewed throbbers from the server, always returns
    // a promise
    fetchViewed() {
        return this.get('session.user').then((user) => {
            let viewed = user.get('tour') || [];

            this.set('viewed', viewed);

            return viewed;
        });
    },

    // save the list of viewed throbbers to the server overwriting the
    // entire list
    syncViewed() {
        let viewed = this.get('viewed');

        return this.get('session.user').then((user) => {
            user.set('tour', viewed);

            return user.save();
        });
    },

    // returns throbber content for a given ID only if that throbber hasn't been
    // viewed. Used by the {{gh-tour-item}} component to determine visibility
    activeThrobber(id) {
        let activeThrobbers = this.get('_activeThrobbers');
        return activeThrobbers.findBy('id', id);
    },

    // when a throbber is opened the component will call this method to mark
    // it as viewed and sync with the server. Always returns a promise
    markThrobberAsViewed(id) {
        let viewed = this.get('viewed');

        if (!viewed.includes(id)) {
            viewed.pushObject(id);
            this.trigger('viewed', id);
            return this.syncViewed();
        } else {
            return RSVP.resolve(true);
        }
    },

    // opting-out will use the list of IDs defined in this file making it the
    // single-source-of-truth and allowing future client updates to control when
    // new UI should be surfaced through tour items
    optOut() {
        let allThrobberIds = this.get('throbbers').mapBy('id');

        this.set('viewed', allThrobberIds);
        this.trigger('optOut');

        return this.syncViewed();
    },

    // this is not used anywhere at the moment but it's useful to use via ember
    // inspector as a reset mechanism
    reEnable() {
        this.set('viewed', []);
        return this.syncViewed();
    }

});
