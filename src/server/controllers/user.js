/**
 * 用户信息控制器
 */
var UserProxy = require('../proxy').User;
var EventProxy = require('eventproxy');
var validator = require('validator');
var tools = require('../common/tools');
/**
 * 展示用户设置页面
 */
exports.showSetting = function (req, res, next) {
    UserProxy.getUserById(req.session.user._id, function (err, user) {
        if (err) { return next(err); }
        //点击保存后，提示信息
        if (req.query.save === 'success') {
            user.success = '保存成功！'
        }
        user.error = null;
        return res.render('user/setting', user);
    });
};
/**
 * 保存设置
 */
exports.setting = function (req, res, next) {
    var ep = new EventProxy();
    ep.fail(next);
    
    //显示成功或者错误信息
    function showMessage(msg, data, isSuccess) {
        data = data || req.body;
        var data2 = {
            name: data.name,
            loginname: data.loginname,
            email: data.email,
            phone: data.phone,
            job: data.job,
            location: data.location,
            signature: data.signature,
        };
        if (isSuccess) {
            data2.success = msg;
        } else {
            data2.error = msg;
        }
        res.render('user/setting', data2);
    }
    //处理post请求
    var action = req.body.action;
    if (action === 'change_setting') { //一般信息设置
        var name = validator.trim(req.body.name);
        name = validator.escape(name);
        var phone = validator.trim(req.body.phone);
        phone = validator.escape(phone);
        var job = validator.trim(req.body.job);
        job = validator.escape(job);
        // var email=validator.trim(req.body.email);
        // email=validator.escape(email);
        var location = validator.trim(req.body.location);
        location = validator.escape(location);
        var signature = validator.trim(req.body.signature);
        signature = validator.escape(signature);
            
        //更新
        UserProxy.getUserById(req.session.user._id, ep.done(function (user) {
            user.name = name;
            user.location = location;
            user.signature = signature;
            user.job = job;
            user.phone = phone;
            user.save(function (err) {
                if (err) {
                    return next(err);
                }
                req.session.user = user.toObject({ virtual: true });
                return res.redirect('/setting?save=success');
            });
        }));
    }
    if (action === 'change_password') {
        var old_pass = validator.trim(req.body.old_pass);
        var new_pass = validator.trim(req.body.new_pass);
        var re_new_pass = validator.trim(req.body.re_new_pass);
        if (!old_pass || !new_pass || !re_new_pass) {
            return res.send('旧密码或新密码不得为空');
        }
        if (new_pass !== re_new_pass) {
            return res.send('两次新密码输入的不一致');
        }
        UserProxy.getUserById(req.session.user._id, ep.done(function (user) {

            tools.bcompare(old_pass, user.pass, ep.done(function (bool) {
                if (!bool) {
                    return showMessage('当前密码不正确', user);
                }
                tools.bhash(new_pass, ep.done(function (passhash) {

                    user.pass = passhash;
                    user.save(function (err) {
                        return next(err);
                    });
                    return showMessage('密码修改成功！', user, true);
                }));
            }));
        }));
    }


};