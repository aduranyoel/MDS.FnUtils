// Para comprobar los parametros
function NotUndefinedNullFunction(param) {
    return param !== undefined && param !== null && typeof param !== 'function';
}
function EsTipo(type, param) {
    if (typeof type === 'string') {
        switch (type) {
            case 'array':
                return Array.isArray(param);
            case 'object':
                return Object.prototype.toString.call(param) === '[object Object]';
            case 'formdata':
                return Object.prototype.toString.call(param) === '[object FormData]';
            default:
                return typeof param === type;
        }
    }
    return false;
}
// Para Ejecutar las Transacciones
function Tx(tx, data, controller, thenFn, errorFn) {
    thenFn = EsTipo('function', thenFn) ? thenFn : new Function();
    errorFn = EsTipo('function', errorFn) ? errorFn : new Function();
    for (var i = 0, len = arguments.length; i < len; i++) {
        var siguiente = i + 1;
        if (EsTipo('function', arguments[i])) {
            thenFn = arguments[i];
            if (EsTipo('function', arguments[siguiente])) errorFn = arguments[siguiente];
            break;
        }
    }
    tx = EsTipo('string', tx) ? tx : '';
    data = EsTipo('object', data) ? data : null;
    controller = EsTipo('string', controller) ? controller + '/' : null;

    var defaultController = EsTipo('string', Tx.controller) ? Tx.controller + '/' : '';
    var currentController = controller !== null ? controller : defaultController;

    RunAjax({
        url: SitePath + currentController + tx,
        data: data,
        success: function(res) {
            thenFn(res);
        },
        errorBE: function(err) {
            errorFn(err);
            Dlg.error(err.ErrorMessage, 'AVISO', err.ErrorDetail);
        }
    });
}
// Ajax personalizado
function RunAjax(obj) {
    obj = EsTipo('object', obj) ? obj : {};
    var esFormData = EsTipo('formdata', obj.data);
    obj.data = esFormData ? obj.data : EsTipo('object', obj.data) ? obj.data : {};
    if (!esFormData) {
        obj.data.RedirectGroup = EsTipo('string', obj.data.RedirectGroup)
            ? obj.data.RedirectGroup
            : EsTipo('string', RunAjax.RedirectGroup)
            ? RunAjax.RedirectGroup
            : UtilJs.redirect
            ? UtilJs.redirect
            : '';
    }
    obj.contentType =
        EsTipo('string', obj.contentType) || EsTipo('boolean', obj.contentType)
            ? obj.contentType
            : 'application/json; charset=utf-8';
    obj.blockScreen = EsTipo('boolean', obj.blockScreen) ? obj.blockScreen : true;
    obj.processData = EsTipo('boolean', obj.processData) ? obj.processData : true;
    obj.message = EsTipo('string', obj.message) ? obj.message : 'EJECUTANDO...';
    obj.dataType = EsTipo('string', obj.dataType) ? obj.dataType : 'json';
    obj.timeout = EsTipo('number', obj.timeout) ? obj.timeout : 180000;
    obj.cache = EsTipo('boolean', obj.cache) ? obj.cache : false;
    obj.type = EsTipo('string', obj.type) ? obj.type : 'POST';
    var fnBeforeSendCopy = EsTipo('function', obj.beforeSend) ? obj.beforeSend : new Function();
    var fnCompleteCopy = EsTipo('function', obj.complete) ? obj.complete : new Function();
    var fnSuccessCopy = EsTipo('function', obj.success) ? obj.success : new Function();
    function checkBlock() {
        setTimeout(function() {
            if ($.active === 0) {
                $.unblockUI();
            }
        }, 500);
    }
    function checkTypeError(type) {
        return type === 'EvalError'
            ? 'An error has occurred in the eval() function'
            : type === 'RangeError'
            ? "A number 'out of range' has occurred"
            : type === 'ReferenceError'
            ? 'An illegal reference has occurred'
            : type === 'SyntaxError'
            ? 'A syntax error has occurred'
            : type === 'TypeError'
            ? 'A type error has occurred'
            : type === 'URIError'
            ? 'An error in encodeURI() has occurred'
            : '';
    }
    function msgError(err) {
        checkBlock();
        Dlg.warning(checkTypeError(err.name), 'AVISO', err.stack);
    }
    obj.beforeSend = function(jqXHR, settings) {
        if (obj.blockScreen && $('.blockUI.blockOverlay').length === 0) {
            $.blockUI({
                message: obj.message,
                baseZ: 50000,
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: 'black',
                    color: 'white',
                    '-webkit-border-radius': '10px',
                    '-moz-border-radius': '10px',
                    'border-radius': '10px',
                    opacity: 0.5
                }
            });
        }
        try {
            fnBeforeSendCopy.call(this, jqXHR, settings);
        } catch (err) {
            msgError(err);
        }
    };
    obj.complete = function(jqXHR, textStatus) {
        checkBlock();
        try {
            fnCompleteCopy.call(this, jqXHR, textStatus);
        } catch (err) {
            msgError(err);
        }
    };
    obj.success = function(data, textStatus, jqXHR) {
        if (
            data.hasOwnProperty('Code') &&
            data.hasOwnProperty('ErrorMessage') &&
            data.hasOwnProperty('ErrorDetail')
        ) {
            if (data.Code !== 0) {
                if (EsTipo('function', obj.errorBE)) {
                    try {
                        obj.errorBE.call(this, data, textStatus, jqXHR);
                    } catch (err) {
                        msgError(err);
                    }
                } else {
                    Dlg.error(data.ErrorMessage, 'AVISO', data.ErrorDetail);
                }
            } else {
                var params = data.hasOwnProperty('Data')
                    ? [data.Data, data, textStatus, jqXHR]
                    : [data, textStatus, jqXHR];
                try {
                    fnSuccessCopy.apply(this, params);
                } catch (err) {
                    msgError(err);
                }
            }
            if (data.hasOwnProperty('Trace')) {
                if (MDSJsUtil)
                    if (MDSJsUtil.hasOwnProperty('addTraces')) MDSJsUtil.addTraces(data.Trace);
            }
        } else {
            try {
                fnSuccessCopy.call(this, data, textStatus, jqXHR);
            } catch (err) {
                msgError(err);
            }
        }
    };
    obj.error = EsTipo('function', obj.error)
        ? obj.error
        : function(jqXHR, textStatus, errorThrown) {
              Dlg.warning(jqXHR.statusText);
          };

    if (!esFormData) obj.data = JSON.stringify(obj.data);
    $.ajax(obj);
}
// Para usar BootstrapDialog https://cdnjs.com/libraries/bootstrap3-dialog
function Dlg(message, title, detail, btnText, type) {
    function valid(param) {
        return typeof param === 'string';
    }
    var msg = valid(message) ? message : '';
    title = valid(title) ? title : 'AVISO';
    btnText = valid(btnText) ? btnText : 'ACEPTAR';
    detail = valid(detail) ? detail : null;
    type = valid(type) ? type : BootstrapDialog.TYPE_DEFAULT;

    function siDetail(param) {
        if (param === null) return '';
        return (
            '<div>' +
            "<a href=\"javascript:void(0)\" onClick=\"var x = this.parentNode.querySelector('p'); x.style.display === 'none' ? x.style.display = '' : x.style.display = 'none';\">" +
            'Ver Detalle' +
            '</a>' +
            '<p style="max-height: 400px;overflow: auto; display: none; word-break: break-all;">' +
            detail +
            '</p>' +
            '</div>'
        );
    }
    message = '<p style="word-break: break-all;">' + msg + '</p>' + siDetail(detail);

    BootstrapDialog.show({
        title: '::: ' + title + ' :::',
        message: message,
        type: type,
        size: BootstrapDialog.SIZE_NORMAL,
        buttons: [
            {
                label: btnText,
                cssClass: 'btn-primary',
                action: function(dialogItself) {
                    dialogItself.close();
                }
            }
        ]
    });
}
Dlg.error = function(message, title, detail, btnText) {
    Dlg(message, title, detail, btnText, BootstrapDialog.TYPE_DANGER);
};
Dlg.warning = function(message, title, detail, btnText) {
    Dlg(message, title, detail, btnText, BootstrapDialog.TYPE_WARNING);
};
// Poner Evento
function PutEvent(target, event, global, callback) {
    callback = EsTipo('function', callback) ? callback : new Function();
    for (var i = 0, len = arguments.length; i < len; i++) {
        if (EsTipo('function', arguments[i])) {
            callback = arguments[i];
            break;
        }
    }
    target = NotUndefinedNullFunction(target) ? target : null;
    event = EsTipo('string', event) ? event : 'click';
    global = EsTipo('boolean', global) ? global : true;

    if (target !== null) {
        $(global ? document : target).off(
            event,
            global ? (target === document ? '' : target) : null
        );
        $(global ? document : target).on(event, global ? target : null, callback);
    }
}
// Quitar Evento
function DelEvent(target, event, global) {
    target = NotUndefinedNullFunction(target) ? target : null;
    event = EsTipo('string', event) ? event : 'click';
    global = EsTipo('boolean', global) ? global : true;

    if (target !== null) {
        $(global ? document : target).off(
            event,
            global ? (target === document ? '' : target) : null
        );
    }
}
// Para obtener las variables de la URL
function GetUrlParams(variable) {
    'use strict';
    if (window.location.href.indexOf('?') !== -1) {
        var queryAll = window.location.href.split('?');
        var query = queryAll[1];
        var vars = query.split('&');
        if (!EsTipo('string', variable)) {
            var obj = new Object();
            for (var j = 0, leng = vars.length; j < leng; j++) {
                var pair = vars[j].split('=');
                obj[pair[0]] = pair[1];
            }
            return obj;
        } else {
            for (var i = 0, len = vars.length; i < len; i++) {
                var currentPair = vars[i].split('=');
                if (currentPair[0] === variable) {
                    return currentPair[1];
                }
            }
        }
    }
    return false;
}
// Para ocultar y mostrar elementos pasando la lista de los id
function MostrarVista(mostrar, ocultar) {
    'use strict';
    if (!Array.isArray(mostrar) && !Array.isArray(ocultar)) return false;
    function hide(fn) {
        for (var i = 0, len = ocultar.length; i < len; i++) {
            var element = document.getElementById(ocultar[i]);
            if (element) element.style.display = 'none';
        }
        fn();
    }
    function show() {
        for (var i = 0, len = mostrar.length; i < len; i++) {
            var element = document.getElementById(mostrar[i]);
            if (element) element.style.display = '';
        }
    }
    hide(show);
}
// Para usar SweetAlert2 ver "9" https://cdn.jsdelivr.net/npm/sweetalert2@9.4.0/dist/sweetalert2.all.min.js
function Msg(text, type, title, confirmButtonText, thenFn, cancelFn, isConfirm) {
    thenFn = EsTipo('function', thenFn) ? thenFn : new Function();
    cancelFn = EsTipo('function', cancelFn) ? cancelFn : new Function();
    for (var i = 0, len = arguments.length; i < len; i++) {
        var siguiente = i + 1;
        if (EsTipo('function', arguments[i])) {
            thenFn = arguments[i];
            if (EsTipo('function', arguments[siguiente])) cancelFn = arguments[siguiente];
            break;
        }
    }

    isConfirm = EsTipo('boolean', isConfirm) ? isConfirm : false;
    title = EsTipo('string', title) ? title : 'ATENCIÓN';
    type = EsTipo('string', type) ? type : 'warning';
    text = EsTipo('string', text) ? text : '';
    confirmButtonText = EsTipo('string', confirmButtonText)
        ? confirmButtonText
        : isConfirm
        ? 'SI, CONFIRMAR'
        : 'ACEPTAR';

    var styleMsg = document.createElement('style');
    styleMsg.type = 'text/css';
    styleMsg.innerHTML =
        ':root {font-size: 13px;}.swal2-title {margin: 0 0 15px;}.swal2-icon {margin: 1.25em auto 25px;width: 60px;height: 60px;}.swal2-title {margin: 0 0 15px;font-size: 20px;font-weight: 600;line-height: 24px;}div#swal2-content {font-size: 13px;color: rgb(106, 108, 111);}.swal2-styled {height: 34px;font-weight: 400;}.swal2-modal .swal2-styled {box-shadow: none !important;}';
    document.head.appendChild(styleMsg);

    Swal.fire({
        title: title,
        html: text,
        icon: type,
        confirmButtonText: confirmButtonText,
        allowOutsideClick: false,
        allowEscapeKey: false,
        focusConfirm: false,
        showCancelButton: isConfirm,
        cancelButtonColor: '#34495e',
        cancelButtonText: 'CANCELAR',
        confirmButtonColor: isConfirm ? '#e74c3c' : '#34495e',
        reverseButtons: isConfirm
    })
        .then(function(res) {
            if (res.value) {
                thenFn(res);
            } else if (res.dismiss === Swal.DismissReason.cancel) {
                cancelFn(res);
            }
        })
        .finally(function() {
            document.head.removeChild(styleMsg);
        });
}
Msg.confirm = function(text, type, title, confirmButtonText, thenFn, cancelFn) {
    Msg(text, type, title, confirmButtonText, thenFn, cancelFn, true);
};
// Delegacion de eventos
function On(eventName, selector, handler) {
    (function(E, d, w) {
        if (!E.composedPath) {
            E.composedPath = function() {
                if (this.path) {
                    return this.path;
                }
                var target = this.target;

                this.path = [];
                while (target.parentNode !== null) {
                    this.path.push(target);
                    target = target.parentNode;
                }
                this.path.push(d, w);
                return this.path;
            };
        }
    })(Event.prototype, document, window);

    document.addEventListener(
        eventName,
        function(event) {
            var elements = document.querySelectorAll(selector);
            var path = event.composedPath();
            for (var j = 0, leng = path.length; j < leng; j++) {
                for (var i = 0, len = elements.length; i < len; i++) {
                    if (path[j] === elements[i]) {
                        handler.call(elements[i], event);
                    }
                }
            }
        },
        true
    );
}
// Convertir Byte Array (byte[]) a base64
function ByteArrToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
// Saber tamaño en bytes de un string
function ByteSize(s) {
    return unescape(encodeURI(s)).length;
}
// Extends Objetos : Object.assign
function ExtendObj() {
    for (var i = 1, len = arguments.length; i < len; i++)
        for (var key in arguments[i])
            if (arguments[i].hasOwnProperty(key)) arguments[0][key] = arguments[i][key];
    return arguments[0];
}
// Simulador de Spread Operator
function Spread() {
    var spreadArgs = [];
    var length = arguments.length;
    var currentArg;
    for (var i = 0; i < length; i++) {
        currentArg = arguments[i];

        if (Array.isArray(currentArg)) {
            spreadArgs = spreadArgs.concat(currentArg);
        } else {
            spreadArgs.push(currentArg);
        }
    }
    return spreadArgs;
}
// Convertir codigos HEX a valores RGB (#000000 -> rgb(0,0,0))
function HexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16)
        : null;
}
// Para obtener número(s) random verdadero(s)
function RandomExact(cantidad) {
    cantidad = parseInt(cantidad) > 0 ? parseInt(cantidad) : 1;
    var result = [];
    for (var i = 0; i < cantidad; i++) {
        result.push(window.crypto.getRandomValues(new Uint32Array(1))[0]);
    }
    return cantidad > 1 ? result : result[0];
}
// Para crear los Level
function LevelConstructor(selector, name, props) {
    this.selector = typeof selector === 'string' ? selector : '';
    this.name = typeof name === 'string' ? name : '';
    if (Object.prototype.toString.call(props) === '[object Object]') {
        for (var i = 0, len = Object.keys(props).length; i < len; i++) {
            this[Object.keys(props)[i]] = props[Object.keys(props)[i]];
        }
    }
}
// Para usar select2
function PutSelect2(selector, data, option, settings) {
    selector = selector !== undefined ? selector : null;
    data = EsTipo('array', data) ? data : [];
    option = EsTipo('object', option) ? option : {};
    option.text = EsTipo('string', option.text) ? option.text : '';
    option.attr = EsTipo('object', option.attr) ? option.attr : {};
    settings = EsTipo('object', settings) ? settings : {};

    $(selector).html('<option></option>');

    data.forEach(function(d) {
        var opt = document.createElement('option');
        opt.innerHTML = d[option.text];
        Object.keys(option.attr).forEach(function(a) {
            opt.setAttribute(a, d[option.attr[a]]);
        });
        $(selector).append(opt);
    });

    var defaults = {
        placeholder: '',
        allowClear: true
    };
    $(selector).select2($.extend({}, defaults, settings));
}
