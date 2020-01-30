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
                return Object.prototype.toString.call(param) === "[object Object]";
            case 'formdata':
                return Object.prototype.toString.call(param) === "[object FormData]";
            case 'file':
                return Object.prototype.toString.call(param) === "[object File]";
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
    data = EsTipo('object', data) || EsTipo('formdata', data) ? data : null;
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
// Para las Trazas de las Tx
Tx.initTrace = function (selector) {

    Tx.trace = [];

    $(selector).off();
    $(selector).on('click', function () {

        var tableTrace = '<label>- Transacciones</label>'
            + '<table cellpadding="1" cellspacing="1" class="table table-responsive">'
            + '<thead>'
            + '<tr>'
            + '<th>NOMBRE</th>'
            + '<th style="text-align: right;">BACKEND TIME</th>'
            + '</tr>'
            + '</thead>'
            + '<tbody>';

        var datos = EsTipo('array', Tx.trace) ? Tx.trace : [];
        datos.forEach(function (t) {
            if (t.hasOwnProperty('Transactions')) {
                t.Transactions.forEach(function (e) {
                    tableTrace += '<tr><td>' + e.Name + '</td><td style="text-align: right;">' + e.BackendTime + '</td></tr>';
                });
            }
        });
        tableTrace += '</tbody></table>';

        var htmlTrace = '<div id="TxTrace_Modal" class="modal fade" tabindex="-1" role="dialog" data-backdrop="static" data-keyboard="false" data-source="">'
            + '<div class="modal-dialog modal-lg" role="document">'
            + '<div class="modal-content">'
            + '<div class="modal-header">'
            + '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">X</span></button>'
            + '<h4 class="modal-title modal-title-md">TRACE</h4>'
            + '</div>'
            + '<div class="modal-body" style="max-height:400px;overflow:auto;">'
            + '</div>'
            + '<div class="modal-footer">'
            + '<button type="button" class="btn btn-default" data-dismiss="modal"><span>CERRAR</span></button>'
            + '</div>'
            + '</div>'
            + '</div>'
            + '</div>';

        if ($('#TxTrace_Modal').length === 0) $(document.body).append(htmlTrace);
        $('#TxTrace_Modal .modal-body').html(tableTrace);

        $('#TxTrace_Modal').modal();

    });
};
// Ajax personalizado
function RunAjax(obj) {

    obj = EsTipo('object', obj) ? obj : {};
    var esFormData = EsTipo('formdata', obj.data);
    obj.data = esFormData || EsTipo('object', obj.data) ? obj.data : {};
    obj.limit = EsTipo('boolean', obj.limit) ? obj.limit : true;
    if (!esFormData) {
        obj.data.RedirectGroup = EsTipo('string', obj.data.RedirectGroup) ? obj.data.RedirectGroup
            : EsTipo('string', RunAjax.RedirectGroup) ? RunAjax.RedirectGroup
                : typeof UtilJs !== "undefined" && UtilJs.hasOwnProperty('redirect') ? UtilJs.redirect : '';
    } else if (obj.limit && MoreThanTenMbFilesFormData(obj.data)) {
        Dlg.warning('El archivo excede el limite permitido: (10MB)');
        return;
    }
    obj.contentType = EsTipo('string', obj.contentType) || EsTipo('boolean', obj.contentType) ? obj.contentType : esFormData ? false : 'application/json; charset=utf-8';
    obj.blockScreen = EsTipo('boolean', obj.blockScreen) ? obj.blockScreen : true;
    obj.processData = EsTipo('boolean', obj.processData) ? obj.processData : esFormData ? false : true;
    obj.message = EsTipo('string', obj.message) ? obj.message : 'EJECUTANDO...';
    obj.dataType = EsTipo('string', obj.dataType) ? obj.dataType : 'json';
    obj.timeout = EsTipo('number', obj.timeout) ? obj.timeout : 180000;
    obj.cache = EsTipo('boolean', obj.cache) ? obj.cache : false;
    obj.type = EsTipo('string', obj.type) ? obj.type : 'POST';
    var fnBeforeSendCopy = EsTipo('function', obj.beforeSend) ? obj.beforeSend : new Function();
    var fnCompleteCopy = EsTipo('function', obj.complete) ? obj.complete : new Function();
    var fnSuccessCopy = EsTipo('function', obj.success) ? obj.success : new Function();
    function checkBlock() {
        setTimeout(function () {
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
    obj.complete = function (jqXHR, textStatus) {
        checkBlock();
        try {
            fnCompleteCopy.call(this, jqXHR, textStatus);
        } catch (err) {
            msgError(err);
        }
    };
    obj.success = function (data, textStatus, jqXHR) {
        if (data.hasOwnProperty('Code') && data.hasOwnProperty('ErrorMessage') && data.hasOwnProperty('ErrorDetail')) {
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
                var params = data.hasOwnProperty('Data') ? [data.Data, data, textStatus, jqXHR] : [data, textStatus, jqXHR];
                try {
                    fnSuccessCopy.apply(this, params);
                } catch (err) {
                    msgError(err);
                }
            }
            if (data.hasOwnProperty('Trace')) {
                typeof Tx !== "undefined" && Tx.hasOwnProperty('trace') && EsTipo('array', Tx.trace)
                    ? Tx.trace.push(data.Trace)
                    : typeof MDSJsUtil !== "undefined" && MDSJsUtil.hasOwnProperty('addTraces')
                        ? MDSJsUtil.addTraces(data.Trace) : null;
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
        : function (jqXHR, textStatus, errorThrown) {
            Dlg.warning(jqXHR.statusText);
        };

    if (!esFormData) obj.data = JSON.stringify(obj.data);
    $.ajax(obj);
}
// Para mostrar Dialog
function Dlg(message, title, detail, btnText, type) {

    function valid(param) {
        return typeof param === 'string';
    }
    var msg = valid(message) ? message : '';
    title = valid(title) ? title : 'AVISO';
    btnText = valid(btnText) ? btnText : 'ACEPTAR';
    detail = valid(detail) ? detail : null;
    type = valid(type) ? type : '';
    var isMovil = Dlg.movil === true;
    function ifDetail(param) {
        if (param === null) return '';
        return (
            '<div>' +
            "<a href=\"javascript:void(0)\" onClick=\"var x = this.parentNode.querySelector('p'); x.style.display === 'none' ? x.style.display = '' : x.style.display = 'none';\">" +
            'Ver Detalle' +
            '</a>' +
            '<p style="max-height: 40vh;overflow: auto; display: none; word-break: break-all;">' +
            detail +
            '</p>' +
            '</div>'
        );
    }
    function msgBody() {
        return '<p style="word-break: break-all;">' + msg + '</p>' + ifDetail(detail);
    }
    function typeMsg() {
        switch (type) {
            case 'warning':
                return isMovil ? 'background-color: #f8ac59; color: white;' : 'background-color: rgb(240, 173, 78); color: white;';
            case 'error':
                return isMovil ? 'background-color: #23c6c8; color: white;' : 'background-color: rgb(217, 83, 79); color: white;';
            default:
                return '';
        }
    }
    var modalContainer = document.createElement('div');
    var modal = '' +
        '<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header" style="padding: 15px;height: 45px;display: block;  ' + typeMsg() + '">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '<h5 class="modal-title" style="font-size: 15px;margin: 0;font-weight: normal;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">::: ' +  title + ' :::</h5>' +
        '</div>' +
        '<div class="modal-body">' +
        msgBody() +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-primary btn-dialog" data-dismiss="modal">' + btnText + '</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';

    modalContainer.innerHTML = modal;
    document.body.appendChild(modalContainer);
    $(modalContainer.querySelector('.modal')).on('hidden.bs.modal', function () {

        document.body.removeChild(modalContainer);
    });
    $(modalContainer.querySelector('.modal')).modal('show');
}
Dlg.error = function (message, title, detail, btnText) {
    Dlg(message, title, detail, btnText, 'error');
};
Dlg.warning = function (message, title, detail, btnText) {
    Dlg(message, title, detail, btnText, 'warning');
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
        $(global ? document : target).off(event, global ? target === document ? '' : target : null);
        $(global ? document : target).on(event, global ? target : null, callback);
    }
}
// Quitar Evento
function DelEvent(target, event, global) {

    target = NotUndefinedNullFunction(target) ? target : null;
    event = EsTipo('string', event) ? event : 'click';
    global = EsTipo('boolean', global) ? global : true;

    if (target !== null) {
        $(global ? document : target).off(event, global ? target === document ? '' : target : null);
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
    confirmButtonText = EsTipo('string', confirmButtonText) ? confirmButtonText : isConfirm ? 'SI, CONFIRMAR' : 'ACEPTAR';
    var isMovile = Msg.movil === true;

    var styleMsg = document.createElement('style');
    styleMsg.type = 'text/css';
    styleMsg.innerHTML = ':root{font-size: 11px;}.swal2-title {margin: 0 0 15px;}.swal2-title {margin: 0 0 15px;font-size: 20px;font-weight: 600;line-height: 24px;}div#swal2-content {font-size: 13px;color: rgb(106, 108, 111);}.swal2-styled {height: 34px;font-weight: 400;}.swal2-modal .swal2-styled {box-shadow: none !important;}.swal2-popup{width: 32em !important}';
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
        cancelButtonColor: isMovile ? '#19a0a1' : '#34495e',
        cancelButtonText: 'CANCELAR',
        confirmButtonColor: isConfirm ? isMovile ? '#ed5565' : '#e74c3c' : isMovile ? '#19a0a1' : '#34495e',
        reverseButtons: isConfirm
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
        for (var key in arguments[i]) if (arguments[i].hasOwnProperty(key)) arguments[0][key] = arguments[i][key];
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
        for (var k in props) {
            this[k] = props[k];
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

    $(selector).html("<option></option>");

    data.forEach(function (d) {
        var opt = document.createElement('option');
        opt.innerHTML = d[option.text];
        Object.keys(option.attr).forEach(function (a) {
            opt.setAttribute(a, d[option.attr[a]]);
        });
        $(selector).append(opt);
    });

    var defaults = {
        placeholder: "",
        allowClear: true
    };
    $(selector).select2($.extend({}, defaults, settings));
}
// Para obtener las key de un FormData
function KeysFormData(fd) {

    if (!EsTipo('formdata', fd)) return [];
    var arrKeys = [];
    fd.forEach(function (val, key) {
        arrKeys.push(key);
    });
    return arrKeys;
}
// Para comprobar si algun archivo del FormData es mayor a 10 MB
function MoreThanTenMbFilesFormData(fd) {

    if (!EsTipo('formdata', fd)) return false;
    var keysFD = KeysFormData(fd);
    for (var i = 0, len = keysFD.length; i < len; i++) {
        var k = keysFD[i];
        if (EsTipo('file', fd.get(k)) && fd.get(k).size > 10485760) return true;
    }
    return false;
}
// Para crear una tabla tipo arbol
Object.defineProperty(Object.prototype, 'treeTable', {
    value: function (settings) {
        'use strict';

        var table = this;
        if (!table || Object.prototype.toString.call(settings) !== "[object Object]") return false;

        var allColumns = Array.isArray(settings.columns) ? settings.columns : [];
        var data = Array.isArray(settings.data) ? settings.data : [];
        var icons = Object.prototype.toString.call(icons) === "[object Object]" ? settings.icons : {};
        var iconCollapsed = icons.collapsed ? icons.collapsed : 'fa fa-chevron-right';
        var iconExpanded = icons.expanded ? icons.expanded : 'fa fa-chevron-down';
        var columns = [];

        for (var ac = 0, lenAc = allColumns.length; ac < lenAc; ac++) {
            var currentColumn = allColumns[ac];
            if (currentColumn['visible'] === false) continue;
            columns.push(currentColumn);
        }

        table.innerHTML = '';

        var thead = document.createElement('thead');
        var trHead = document.createElement('tr');
        var columnsLength = columns.length;

        for (var cl = 0; cl < columnsLength; cl++) {
            var ccl = columns[cl];
            var th = document.createElement('th');
            var title = ccl.title ? ccl.title : '';
            var className = ccl.className ? ccl.className : '';
            th.innerHTML = title;
            th.className = className;
            trHead.appendChild(th);
        }

        thead.appendChild(trHead);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');

        if (data.length === 0) {
            var trEmpty = document.createElement('tr');
            var tdEmpty = document.createElement('td');
            tdEmpty.innerHTML = 'NO SE ENCONTRARON REGISTROS';
            tdEmpty.colSpan = columnsLength;
            tdEmpty.style.textAlign = 'center';
            trEmpty.appendChild(tdEmpty);
            tbody.appendChild(trEmpty);
        }
        function actionLink() {
            var icon = this;
            var tr = this.parentNode.parentNode;
            var target = '[data-parent="' + tr.getAttribute('data-index') + '"]';
            var isExpanded = tr.getAttribute('data-control') === 'expanded';
            var body = tr.parentNode;
            var children = body.querySelectorAll(target);

            if (!isExpanded) {

                for (var c = 0, len = children.length; c < len; c++) {
                    var current = children[c];
                    current.style.display = '';
                    var a = current.querySelector('a[icon-tree-table]');
                    if (a) a.className = iconCollapsed;
                }
                icon.className = iconExpanded;
                tr.setAttribute('data-control', 'expanded');
            } else {

                var closeChildren = function (children) {
                    for (var i = 0, len = children.length; i < len; i++) {
                        var current = children[i];
                        current.style.display = 'none';
                        var id = current.getAttribute('data-index');
                        var child = body.querySelectorAll('[data-parent="' + id + '"]');
                        var currentExpanded = current.getAttribute('data-control') === 'expanded';
                        if (child.length > 0 && currentExpanded) {
                            current.setAttribute('data-control', 'collapsed');
                            closeChildren(child);
                        }
                    }
                };
                closeChildren(children);
                icon.className = iconCollapsed;
                tr.setAttribute('data-control', 'collapsed');
            }
        }

        var index = -1;
        function level(dataLevel, lv, parentRow) {

            for (var id = 0, len = dataLevel.length; id < len; id++) {

                index++;
                var row = dataLevel[id];
                var treeChildren = [];
                var tr = document.createElement('tr');

                for (var ch in row) {
                    if (Array.isArray(row[ch]) && row[ch].length > 0) treeChildren.push(ch);
                }

                for (var c = 0; c < columnsLength; c++) {
                    row[columns[c].data] = row[columns[c].data] ? row[columns[c].data] : '';
                }

                for (var i = 0; i < columnsLength; i++) {

                    var data = row[columns[i].data];
                    var text = typeof columns[i].render === 'function' ? columns[i].render(data, tr, row, index) : data;
                    var content = document.createElement('div');
                    content.style.display = 'inline';
                    content.innerHTML = text;
                    if (i === 0 && treeChildren.length > 0) {
                        var tdPrimary = document.createElement('td');
                        var icon = document.createElement('a');
                        icon.className = iconCollapsed;
                        icon.setAttribute('icon-tree-table', true);
                        icon.addEventListener('click', actionLink, false);
                        tdPrimary.appendChild(icon);
                        tdPrimary.appendChild(content);
                        tdPrimary.className = columns[i].className ? columns[i].className : '';
                        tdPrimary.setAttribute('style', 'padding-left: ' + lv * 11 + 'px !important');
                        tr.appendChild(tdPrimary);
                        tr.setAttribute('data-control', 'collapsed');
                    } else {
                        var td = document.createElement('td');
                        td.appendChild(content);
                        td.className = columns[i].className ? columns[i].className : '';
                        tr.appendChild(td);
                    }
                    if (lv > 1) {
                        tr.style.display = 'none';
                        tr.setAttribute('data-parent', parentRow);
                    }
                    tr.setAttribute('data-index', index);
                    tr.setAttribute('data-level', lv);
                }
                tbody.appendChild(tr);

                for (var t = 0, lent = treeChildren.length; t < lent; t++) {

                    var ct = treeChildren[t];

                    level(row[ct], lv + 1, index);
                }
            }
        }

        level(data, 1);

        table.appendChild(tbody);
    }
});

// #region POLYFILL
// FormData https://github.com/jimmywarting/FormData
(function () {
    var k; function l(a) { var b = 0; return function () { return b < a.length ? { done: !1, value: a[b++] } : { done: !0 } } } var m = "function" == typeof Object.defineProperties ? Object.defineProperty : function (a, b, c) { a != Array.prototype && a != Object.prototype && (a[b] = c.value) }, n = "undefined" != typeof window && window === this ? this : "undefined" != typeof global && null != global ? global : this; function p() { p = function () { }; n.Symbol || (n.Symbol = r) } function t(a, b) { this.o = a; m(this, "description", { configurable: !0, writable: !0, value: b }) }
    t.prototype.toString = function () { return this.o }; var r = function () { function a(c) { if (this instanceof a) throw new TypeError("Symbol is not a constructor"); return new t("jscomp_symbol_" + (c || "") + "_" + b++, c) } var b = 0; return a }(); function v() { p(); var a = n.Symbol.iterator; a || (a = n.Symbol.iterator = n.Symbol("Symbol.iterator")); "function" != typeof Array.prototype[a] && m(Array.prototype, a, { configurable: !0, writable: !0, value: function () { return x(l(this)) } }); v = function () { } }
    function x(a) { v(); a = { next: a }; a[n.Symbol.iterator] = function () { return this }; return a } function y(a) { var b = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator]; return b ? b.call(a) : { next: l(a) } } var z; if ("function" == typeof Object.setPrototypeOf) z = Object.setPrototypeOf; else { var A; a: { var B = { u: !0 }, C = {}; try { C.__proto__ = B; A = C.u; break a } catch (a) { } A = !1 } z = A ? function (a, b) { a.__proto__ = b; if (a.__proto__ !== b) throw new TypeError(a + " is not extensible"); return a } : null } var D = z;
    function E() { this.h = !1; this.f = null; this.m = void 0; this.c = 1; this.l = this.v = 0; this.g = null } function F(a) { if (a.h) throw new TypeError("Generator is already running"); a.h = !0 } E.prototype.i = function (a) { this.m = a }; E.prototype.j = function (a) { this.g = { w: a, A: !0 }; this.c = this.v || this.l }; E.prototype["return"] = function (a) { this.g = { "return": a }; this.c = this.l }; function G(a, b) { a.c = 3; return { value: b } } function H(a) { this.a = new E; this.B = a }
    H.prototype.i = function (a) { F(this.a); if (this.a.f) return I(this, this.a.f.next, a, this.a.i); this.a.i(a); return J(this) }; function K(a, b) { F(a.a); var c = a.a.f; if (c) return I(a, "return" in c ? c["return"] : function (d) { return { value: d, done: !0 } }, b, a.a["return"]); a.a["return"](b); return J(a) } H.prototype.j = function (a) { F(this.a); if (this.a.f) return I(this, this.a.f["throw"], a, this.a.i); this.a.j(a); return J(this) };
    function I(a, b, c, d) { try { var e = b.call(a.a.f, c); if (!(e instanceof Object)) throw new TypeError("Iterator result " + e + " is not an object"); if (!e.done) return a.a.h = !1, e; var f = e.value } catch (g) { return a.a.f = null, a.a.j(g), J(a) } a.a.f = null; d.call(a.a, f); return J(a) } function J(a) { for (; a.a.c;)try { var b = a.B(a.a); if (b) return a.a.h = !1, { value: b.value, done: !1 } } catch (c) { a.a.m = void 0, a.a.j(c) } a.a.h = !1; if (a.a.g) { b = a.a.g; a.a.g = null; if (b.A) throw b.w; return { value: b["return"], done: !0 } } return { value: void 0, done: !0 } }
    function L(a) { this.next = function (b) { return a.i(b) }; this["throw"] = function (b) { return a.j(b) }; this["return"] = function (b) { return K(a, b) }; v(); this[Symbol.iterator] = function () { return this } } function M(a, b) { var c = new L(new H(b)); D && D(c, a.prototype); return c }
    if ("undefined" !== typeof Blob && ("undefined" === typeof FormData || !FormData.prototype.keys)) {
        var N = function (a, b) { for (var c = 0; c < a.length; c++)b(a[c]) }, O = function (a, b, c) { return b instanceof Blob ? [String(a), b, void 0 !== c ? c + "" : "string" === typeof b.name ? b.name : "blob"] : [String(a), String(b)] }, P = function (a, b) { if (a.length < b) throw new TypeError(b + " argument required, but only " + a.length + " present."); }, Q = function (a) {
            var b = y(a); a = b.next().value; var c = b.next().value; b = b.next().value; c instanceof Blob && (c = new File([c],
                b, { type: c.type, lastModified: c.lastModified })); return [a, c]
        }, R = "object" === typeof window ? window : "object" === typeof self ? self : this, S = R.FormData, T = R.XMLHttpRequest && R.XMLHttpRequest.prototype.send, U = R.Request && R.fetch, V = R.navigator && R.navigator.sendBeacon; p(); var W = R.Symbol && Symbol.toStringTag; W && (Blob.prototype[W] || (Blob.prototype[W] = "Blob"), "File" in R && !File.prototype[W] && (File.prototype[W] = "File")); try { new File([], "") } catch (a) {
        R.File = function (b, c, d) {
            b = new Blob(b, d); d = d && void 0 !== d.lastModified ? new Date(d.lastModified) :
                new Date; Object.defineProperties(b, { name: { value: c }, lastModifiedDate: { value: d }, lastModified: { value: +d }, toString: { value: function () { return "[object File]" } } }); W && Object.defineProperty(b, W, { value: "File" }); return b
        }
        } p(); v(); var X = function (a) {
        this.b = []; if (!a) return this; var b = this; N(a.elements, function (c) {
            if (c.name && !c.disabled && "submit" !== c.type && "button" !== c.type) if ("file" === c.type) {
                var d = c.files && c.files.length ? c.files : [new File([], "", { type: "application/octet-stream" })]; N(d, function (e) {
                    b.append(c.name,
                        e)
                })
            } else "select-multiple" === c.type || "select-one" === c.type ? N(c.options, function (e) { !e.disabled && e.selected && b.append(c.name, e.value) }) : "checkbox" === c.type || "radio" === c.type ? c.checked && b.append(c.name, c.value) : (d = "textarea" === c.type ? c.value.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n") : c.value, b.append(c.name, d))
        })
        }; k = X.prototype; k.append = function (a, b, c) { P(arguments, 2); var d = y(O.apply(null, arguments)), e = d.next().value, f = d.next().value; d = d.next().value; this.b.push([e, f, d]) }; k["delete"] = function (a) {
            P(arguments,
                1); var b = []; a = String(a); N(this.b, function (c) { c[0] !== a && b.push(c) }); this.b = b
        }; k.entries = function b() { var c, d = this; return M(b, function (e) { 1 == e.c && (c = 0); if (3 != e.c) return c < d.b.length ? e = G(e, Q(d.b[c])) : (e.c = 0, e = void 0), e; c++; e.c = 2 }) }; k.forEach = function (b, c) { P(arguments, 1); for (var d = y(this), e = d.next(); !e.done; e = d.next()) { var f = y(e.value); e = f.next().value; f = f.next().value; b.call(c, f, e, this) } }; k.get = function (b) {
            P(arguments, 1); var c = this.b; b = String(b); for (var d = 0; d < c.length; d++)if (c[d][0] === b) return Q(this.b[d])[1];
            return null
        }; k.getAll = function (b) { P(arguments, 1); var c = []; b = String(b); for (var d = 0; d < this.b.length; d++)this.b[d][0] === b && c.push(Q(this.b[d])[1]); return c }; k.has = function (b) { P(arguments, 1); b = String(b); for (var c = 0; c < this.b.length; c++)if (this.b[c][0] === b) return !0; return !1 }; k.keys = function c() { var d = this, e, f, g, h, u; return M(c, function (q) { 1 == q.c && (e = y(d), f = e.next()); if (3 != q.c) { if (f.done) { q.c = 0; return } g = f.value; h = y(g); u = h.next().value; return G(q, u) } f = e.next(); q.c = 2 }) }; k.set = function (c, d, e) {
            P(arguments, 2);
            c = String(c); for (var f = [], g = !1, h = 0; h < this.b.length; h++)this.b[h][0] === c ? g || (f[h] = O.apply(null, arguments), g = !0) : f.push(this.b[h]); g || f.push(O.apply(null, arguments)); this.b = f
        }; k.values = function d() { var e = this, f, g, h, u, q; return M(d, function (w) { 1 == w.c && (f = y(e), g = f.next()); if (3 != w.c) { if (g.done) { w.c = 0; return } h = g.value; u = y(h); u.next(); q = u.next().value; return G(w, q) } g = f.next(); w.c = 2 }) }; X.prototype._asNative = function () {
            for (var d = new S, e = y(this), f = e.next(); !f.done; f = e.next()) {
                var g = y(f.value); f = g.next().value;
                g = g.next().value; d.append(f, g)
            } return d
        }; X.prototype._blob = function () {
            for (var d = "----formdata-polyfill-" + Math.random(), e = [], f = y(this), g = f.next(); !g.done; g = f.next()) { var h = y(g.value); g = h.next().value; h = h.next().value; e.push("--" + d + "\r\n"); h instanceof Blob ? e.push('Content-Disposition: form-data; name="' + g + '"; filename="' + h.name + '"\r\n', "Content-Type: " + (h.type || "application/octet-stream") + "\r\n\r\n", h, "\r\n") : e.push('Content-Disposition: form-data; name="' + g + '"\r\n\r\n' + h + "\r\n") } e.push("--" + d + "--");
            return new Blob(e, { type: "multipart/form-data; boundary=" + d })
        }; X.prototype[Symbol.iterator] = function () { return this.entries() }; X.prototype.toString = function () { return "[object FormData]" }; W && (X.prototype[W] = "FormData"); if (T) {
            var Y = R.XMLHttpRequest.prototype.setRequestHeader; R.XMLHttpRequest.prototype.setRequestHeader = function (d, e) { Y.call(this, d, e); "content-type" === d.toLowerCase() && (this.s = !0) }; R.XMLHttpRequest.prototype.send = function (d) {
                d instanceof X ? (d = d._blob(), this.s || this.setRequestHeader("Content-Type",
                    d.type), T.call(this, d)) : T.call(this, d)
            }
        } if (U) { var Z = R.fetch; R.fetch = function (d, e) { e && e.body && e.body instanceof X && (e.body = e.body._blob()); return Z.call(this, d, e) } } V && (R.navigator.sendBeacon = function (d, e) { e instanceof X && (e = e._asNative()); return V.call(this, d, e) }); R.FormData = X
    };
})();

// #endregion
