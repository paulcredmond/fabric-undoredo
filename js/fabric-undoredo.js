/**
 * @class fabricUndoRedo
 */
/// <reference path="../typings/modules/fabric/fabricjs.d.ts" />
var fabricUndoRedo = (function () {
    function fabricUndoRedo() {
        /**
         * Properties used for history states
         */
        this.fabricHistory = [];
        this.fabricHistoryMods = 0;
        this.fabricHistoryReplay = false;
        // Scope context
        var self = this;
        this.fabricDm = document.forms['fabric-dm'].elements['fabric-dmo'];
        this.fabricDmOnOff = document.getElementById('fabric-dmOnOff');
        this.fabricUndo = document.getElementById('fabric-undo');
        this.fabricRedo = document.getElementById('fabric-redo');
        this.fabricSave = document.getElementById('fabric-save');
        this.fabricLoad = document.getElementById('fabric-load');
        for (var i = 0; i < this.fabricDm.length; i++) {
            this.fabricDm[i].addEventListener('click', function (e) {
                if (this.value === 'on') {
                    self.fabricDmOnOff.textContent = 'On';
                    self.fabricCanvas.isDrawingMode = true;
                }
                else {
                    self.fabricDmOnOff.textContent = 'Off';
                    self.fabricCanvas.isDrawingMode = false;
                }
            });
        }
        this.fabricUndo.addEventListener('click', function () {
            self.fabricHistoryAction('undo');
            self.fabricDisableUndoRedo();
        });
        this.fabricRedo.addEventListener('click', function () {
            self.fabricHistoryAction('redo');
            self.fabricDisableUndoRedo();
        });
        this.fabricSave.addEventListener('click', function () {
            self.fabricSaveLocalStorage();
        });
        this.fabricLoad.addEventListener('click', function () {
            self.fabricLoadLocalStorage();
        });
        /* ===================================================== */
        /* Canvas - Start
        /* ===================================================== */
        this.fabricCanvas = new fabric.Canvas('fabric-Canvas', {
            isDrawingMode: true,
            width: 600,
            height: 400,
            backgroundColor: '#fff'
        });
        // Set to disabled on load
        this.fabricDisableUndoRedo();
        /* ===================================================== */
        /* Canvas - Events
        /* ===================================================== */
        this.fabricCanvas.on({
            'object:modified': function (e) {
                if (self.fabricHistoryReplay === false) {
                    self.fabricSaveCanvasToObject();
                }
            },
            'object:added': function (e) {
                if (self.fabricHistoryReplay === false) {
                    self.fabricSaveCanvasToObject();
                }
            },
            'object:removed': function (e) {
                if (self.fabricHistoryReplay === false) {
                    self.fabricSaveCanvasToObject();
                }
            }
        });
    }
    /* ===================================================== */
    /* Undo/Redo
    /* ===================================================== */
    /**
     * Saves the canvas data to a JS object
     */
    fabricUndoRedo.prototype.fabricSaveCanvasToObject = function () {
        var obj = JSON.stringify(this.fabricCanvas.toDatalessJSON());
        // Reset mods due to new action
        this.fabricHistoryMods = 0;
        if (this.fabricHistory.length === 6) {
            this.fabricHistory.shift();
            this.fabricHistory.push(obj);
        }
        else if (this.fabricHistory.length < 6) {
            this.fabricHistory.push(obj);
        }
        // Disable or enable buttons
        this.fabricDisableUndoRedo();
    };
    /**
     * Disable undo/redo buttons if no actions left
     * @param action Either 'undo' or 'redo'
     */
    fabricUndoRedo.prototype.fabricDisableUndoRedo = function () {
        var self = this;
        var mods = this.fabricHistoryMods;
        var hist = this.fabricHistory.length;
        // No redo steps left
        if (mods === 0) {
            this.fabricRedo.disabled = true;
        }
        else {
            this.fabricRedo.disabled = false;
        }
        // No undo steps left or no history
        if (mods === hist || hist === 0 || mods === 5) {
            this.fabricUndo.disabled = true;
        }
        else {
            this.fabricUndo.disabled = false;
        }
    };
    /**
     * Calls the function for undo or redo
     * @param Either 'undo' or 'redo'
     */
    fabricUndoRedo.prototype.fabricHistoryAction = function (action) {
        switch (action) {
            case 'undo':
                this.fabricHistoryActionUndo();
                break;
            case 'redo':
                this.fabricHistoryActionRedo();
                break;
        }
    };
    /**
     * Go back one step
     */
    fabricUndoRedo.prototype.fabricHistoryActionUndo = function () {
        this.fabricHistoryReplay = true;
        var self = this;
        var cb = function () {
            self.fabricHistoryReplay = false;
        };
        if (this.fabricHistoryMods < this.fabricHistory.length) {
            if (this.fabricHistoryMods !== 5) {
                // Clear canvas
                this.fabricCanvas.clear().renderAll();
                // Minus 1 to get previous item, minus last mod and -1 because mods is reset to 0
                var obj = this.fabricHistory[this.fabricHistory.length - 1 - this.fabricHistoryMods - 1];
                this.fabricCanvas.loadFromDatalessJSON(obj, cb, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
                this.fabricHistoryMods += 1;
            }
        }
    };
    /**
     * Go forward one step
     */
    fabricUndoRedo.prototype.fabricHistoryActionRedo = function () {
        this.fabricHistoryReplay = true;
        var self = this;
        var cb = function () {
            self.fabricHistoryReplay = false;
        };
        if (this.fabricHistoryMods > 0) {
            // Clear canvas
            this.fabricCanvas.clear().renderAll();
            // Minus 1 to get previous item, minus the last mod and add one to go forward
            var obj = this.fabricHistory[this.fabricHistory.length - 1 - this.fabricHistoryMods + 1];
            this.fabricCanvas.loadFromDatalessJSON(obj, cb, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
            this.fabricHistoryMods -= 1;
        }
    };
    /* ===================================================== */
    /* Save/Load to local storage
    /* ===================================================== */
    /**
     * Save the canvas
     */
    fabricUndoRedo.prototype.fabricSaveLocalStorage = function () {
        if (localStorage) {
            var obj = JSON.stringify(this.fabricCanvas.toDatalessJSON());
            localStorage.setItem('fabricCanvas', obj);
            this.fabricCanvas.renderAll();
        }
    };
    /**
     * Load the canvas
     */
    fabricUndoRedo.prototype.fabricLoadLocalStorage = function () {
        var self = this;
        var obj;
        var cb = function () {
            self.fabricHistory = [];
            self.fabricHistory.push(obj);
            self.fabricHistoryMods = 0;
            self.fabricHistoryReplay = false;
            self.fabricDisableUndoRedo();
        };
        if (localStorage) {
            obj = localStorage.getItem('fabricCanvas');
            this.fabricCanvas.deactivateAll().clear();
            this.fabricCanvas.loadFromDatalessJSON(obj, cb, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
            this.fabricCanvas.renderAll();
        }
    };
    return fabricUndoRedo;
}());
// Run
var demo = new fabricUndoRedo();
