// Para comprobar los parametros
function NotUndefinedNullFunction(param) {
    if (param !== undefined && param !== null && typeof param !== "function") return true;
    return false;
}
// Para Ejecutar las Transacciones
function Tx(tx, data, controller, thenFn, errorFn) {

    thenFn = typeof thenFn === "function" ? thenFn : new Function;
    errorFn = typeof errorFn === "function" ? errorFn : new Function;
    for (var i = 0, len = arguments.length; i < len; i++) {
        var siguiente = i + 1;
        if (typeof arguments[i] === "function") {
            thenFn = arguments[i];
            if (typeof arguments[siguiente] === "function") errorFn = arguments[siguiente];
            break;
        }
    }
    tx = NotUndefinedNullFunction(tx) ? tx : '';
    data = NotUndefinedNullFunction(data) ? data : null;
    controller = NotUndefinedNullFunction(controller) ? controller + '/' : null;

    var defaultController = Tx.controller !== undefined && Tx.controller !== null
        ? Tx.controller + '/' : "";
    var currentController = controller !== null ? controller : defaultController;

    RunAjax({
        url: SitePath + currentController + tx,
        data: data,
        success: function (res) {
            thenFn(res);
        },
        errorBE: function (err) {
            errorFn(err);
            MDSMessageUtil.ErrorDialogShow(err.ErrorMessage, "AVISO", "Aceptar", err.ErrorDetail);
        }
    });
}
function RunAjax(obj) {

    obj = $.isPlainObject(obj) ? obj : {};
    obj.data = $.isPlainObject(obj.data) ? obj.data : {};
    obj.data.RedirectGroup = obj.data.RedirectGroup ? obj.data.RedirectGroup : UtilJs.redirect ? UtilJs.redirect : "";
    obj.type = obj.type ? obj.type : "POST";
    obj.dataType = obj.dataType ? obj.dataType : "json";
    obj.contentType = obj.contentType ? obj.contentType : "application/json; charset=utf-8";
    obj.cache = obj.cache ? obj.cache : false;
    obj.timeout = obj.timeout ? obj.timeout : 180000;
    obj.processData = obj.processData ? obj.processData : true;
    var fnCompleteCopy = typeof obj.complete === "function" ? obj.complete : new Function;
    var fnBeforeSendCopy = typeof obj.beforeSend === "function" ? obj.beforeSend : new Function;
    var fnSuccessCopy = typeof obj.success === "function" ? obj.success : new Function;
    obj.blockScreen = obj.blockScreen === false ? false : true;
    obj.message = obj.message !== undefined ? obj.message : "EJECUTANDO...";
    obj.beforeSend = function (jqXHR, settings) {
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
                    opacity: .5
                }
            });
        }
        fnBeforeSendCopy.call(this, jqXHR, settings);
    };
    obj.complete = function (jqXHR, textStatus) {
        setTimeout(function () {
            if ($.active === 0) {
                $.unblockUI();
            }
        }, 1000);
        fnCompleteCopy.call(this, jqXHR, textStatus);
    };
    obj.success = function (data, textStatus, jqXHR) {
        if (data.Code !== 0) {
            typeof obj.errorBE === "function" ? obj.errorBE.call(this, data, textStatus, jqXHR)
                : MDSMessageUtil.ErrorDialogShow(data.ErrorMessage, "AVISO", "Aceptar", data.ErrorDetail);
        } else {
            fnSuccessCopy.call(this, data.Data ? data.Data : null, data, textStatus, jqXHR);
        }
    };
    obj.error = typeof obj.error === "function" ? obj.error : function (jqXHR, textStatus, errorThrown) {
        MDSMessageUtil.ErrorDialogShow(jqXHR.statusText, "AVISO", "Aceptar", "");
    };

    obj.data = JSON.stringify(obj.data);
    $.ajax(obj);
}
// Para obtener las variables de la URL
function GetUrlParams(variable) {
    'use strict';
    if (window.location.href.indexOf('?') !== -1) {
        var queryAll = window.location.href.split('?');
        var query = queryAll[1];
        var vars = query.split("&");
        if (variable === undefined) {
            var obj = new Object;
            for (var j = 0, leng = vars.length; j < leng; j++) {
                var pair = vars[j].split("=");
                obj[pair[0]] = pair[1];
            }
            return obj;
        } else {
            for (var i = 0, len = vars.length; i < len; i++) {
                var currentPair = vars[i].split("=");
                if (currentPair[0] === variable) { return currentPair[1]; }
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
            element.style.display = 'none';
        }
        fn();
    }
    function show() {
        for (var i = 0, len = mostrar.length; i < len; i++) {
            var element = document.getElementById(mostrar[i]);
            element.style.display = '';
        }
    }
    hide(show);
}
// Para usar SweetAlert2 ver "8" https://cdn.jsdelivr.net/npm/sweetalert2@8.0.0/dist/sweetalert2.all.min.js
function Msg(text, type, title, confirmButtonText, thenFn) {

    thenFn = typeof thenFn === "function" ? thenFn : new Function;
    for (var i = 0, len = arguments.length; i < len; i++) {
        if (typeof arguments[i] === "function") thenFn = arguments[i];
    }
    title = NotUndefinedNullFunction(title) ? title : 'ATENCIÓN';
    type = NotUndefinedNullFunction(type) ? type : 'warning';
    text = NotUndefinedNullFunction(text) ? text : '';
    confirmButtonText = NotUndefinedNullFunction(confirmButtonText) ? confirmButtonText : 'ACEPTAR';

    var styleMsg = document.createElement('style');
    styleMsg.type = 'text/css';
    styleMsg.innerHTML = ':root {font-size: 13px;}.swal2-title {margin: 0 0 15px;}.swal2-icon {margin: 1.25em auto 25px;width: 60px;height: 60px;}.swal2-title {margin: 0 0 15px;font-size: 20px;font-weight: 600;line-height: 24px;}div#swal2-content {font-size: 13px;color: rgb(106, 108, 111);}.swal2-styled {height: 34px;font-weight: 400;}.swal2-modal .swal2-styled {box-shadow: none !important;}';
    document.head.appendChild(styleMsg);

    Swal.fire({
        title: title,
        text: text,
        type: type,
        confirmButtonColor: "#34495e",
        confirmButtonText: confirmButtonText,
        allowOutsideClick: false,
        allowEscapeKey: false

    })
        .then(function (res) {
            if (res.value) {
                thenFn(res);
            }
        })
        .finally(function () {
            document.head.removeChild(styleMsg);
        });
}
Msg.confirm = function (text, type, title, confirmButtonText, thenFn, cancelFn) {

    thenFn = typeof thenFn === "function" ? thenFn : new Function;
    cancelFn = typeof cancelFn === "function" ? cancelFn : new Function;
    for (var i = 0, len = arguments.length; i < len; i++) {
        var siguiente = i + 1;
        if (typeof arguments[i] === "function") {
            thenFn = arguments[i];
            if (typeof arguments[siguiente] === "function") cancelFn = arguments[siguiente];
            break;
        }
    }
    title = NotUndefinedNullFunction(title) ? title : 'ATENCIÓN';
    type = NotUndefinedNullFunction(type) ? type : 'warning';
    text = NotUndefinedNullFunction(text) ? text : '';
    confirmButtonText = NotUndefinedNullFunction(confirmButtonText) ? confirmButtonText : 'SI, CONFIRMAR';

    var styleMsg = document.createElement('style');
    styleMsg.type = 'text/css';
    styleMsg.innerHTML = ':root {font-size: 13px;}.swal2-title {margin: 0 0 15px;}.swal2-icon {margin: 1.25em auto 25px;width: 60px;height: 60px;}.swal2-title {margin: 0 0 15px;font-size: 20px;font-weight: 600;line-height: 24px;}div#swal2-content {font-size: 13px;color: rgb(106, 108, 111);}.swal2-styled {height: 34px;font-weight: 400;}.swal2-modal .swal2-styled {box-shadow: none !important;}';
    document.head.appendChild(styleMsg);

    Swal.fire({
        title: title,
        text: text,
        type: type,
        showCancelButton: true,
        cancelButtonColor: "#34495e",
        cancelButtonText: "CANCELAR",
        confirmButtonColor: "#e74c3c",
        confirmButtonText: confirmButtonText,
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: false

    })
        .then(function (res) {
            if (res.value) {
                thenFn(res);
            } else if (res.dismiss === Swal.DismissReason.cancel) {
                cancelFn(res);
            }
        })
        .finally(function () {
            document.head.removeChild(styleMsg);
        });
};
// Delegacion de eventos
function On(eventName, selector, handler) {

    (function (E, d, w) {
        if (!E.composedPath) {
            E.composedPath = function () {
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

    document.addEventListener(eventName, function (event) {
        var elements = document.querySelectorAll(selector);
        var path = event.composedPath();
        for (var j = 0, leng = path.length; j < leng; j++) {
            for (var i = 0, len = elements.length; i < len; i++) {
                if (path[j] === elements[i]) {
                    handler.call(elements[i], event);
                }
            }
        }
    }, true);
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
            if (arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
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
    return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : null;
}
function RandomExact(cantidad) {
    cantidad = parseInt(cantidad) > 0 ? parseInt(cantidad) : 1;
    var result = [];
    for (var i = 0; i < cantidad; i++) {
        result.push(window.crypto.getRandomValues(new Uint32Array(cantidad))[i]);
    }
    return cantidad > 1 ? result : result[0];
}
