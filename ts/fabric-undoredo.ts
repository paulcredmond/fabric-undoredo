/**
 * @class fabricUndoRedo
 */

/// <reference path="../typings/modules/fabric/fabricjs.d.ts" />

class fabricUndoRedo {

    fabricCanvas: any;
	fabricDm: any;
	fabricDmOnOff: any;
	fabricUndo: any;
	fabricRedo: any;
	fabricSave: any;
	fabricLoad: any;	

	/**
	 * Properties used for history states 
	 */	
	protected fabricHistory: Array<any> = [];
	protected fabricHistoryMods: number = 0;
	protected fabricHistoryReplay: boolean = false;    
    
    constructor() {

		// Scope context
		let self = this;	

		this.fabricDm   = document.forms['fabric-dm'].elements['fabric-dmo'];
		this.fabricDmOnOff = document.getElementById('fabric-dmOnOff') as HTMLElement;
		this.fabricUndo = document.getElementById('fabric-undo') as HTMLElement;
		this.fabricRedo = document.getElementById('fabric-redo') as HTMLElement;
		this.fabricSave = document.getElementById('fabric-save') as HTMLElement;
		this.fabricLoad = document.getElementById('fabric-load') as HTMLElement;

		for (let i = 0; i < this.fabricDm.length; i++) {
			
			this.fabricDm[i].addEventListener('click', function(e: any) {
				if ( this.value === 'on' ) {
					self.fabricDmOnOff.textContent = 'On';
					self.fabricCanvas.isDrawingMode = true;
				} else {
					self.fabricDmOnOff.textContent = 'Off';
					self.fabricCanvas.isDrawingMode = false;
				}	
			});
		}

		this.fabricUndo.addEventListener('click', function() {
            self.fabricHistoryAction('undo');
			self.fabricDisableUndoRedo();
        });

		this.fabricRedo.addEventListener('click', function() {
            self.fabricHistoryAction('redo');
			self.fabricDisableUndoRedo();
        });

		this.fabricSave.addEventListener('click', function() {
            self.fabricSaveLocalStorage();
        });

		this.fabricLoad.addEventListener('click', function() {
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
			'object:modified': function(e: any) {
				if (self.fabricHistoryReplay === false) {
					self.fabricSaveCanvasToObject();
				}
			},					
			'object:added': function(e: any) {
				if (self.fabricHistoryReplay === false) {
					self.fabricSaveCanvasToObject();
				}
			},
			'object:removed': function(e: any) {
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
	fabricSaveCanvasToObject() {
		let obj = JSON.stringify(this.fabricCanvas.toDatalessJSON());

		// Reset mods due to new action
		this.fabricHistoryMods = 0;

		if (this.fabricHistory.length === 6) {
			this.fabricHistory.shift();
			this.fabricHistory.push(obj);
		} else if (this.fabricHistory.length < 6) {
			this.fabricHistory.push(obj);
		}

		// Disable or enable buttons
		this.fabricDisableUndoRedo();	
	}

    /**
     * Disable undo/redo buttons if no actions left
     * @param action Either 'undo' or 'redo'
     */
    fabricDisableUndoRedo() {
        let self = this;
        let mods = this.fabricHistoryMods;
        let hist = this.fabricHistory.length;

        // No redo steps left
        if (mods === 0) {
            this.fabricRedo.disabled = true;
        } else {
            this.fabricRedo.disabled = false;
        }

        // No undo steps left or no history
        if (mods === hist || hist === 0 || mods === 5) {
            this.fabricUndo.disabled = true;
        } else {
            this.fabricUndo.disabled = false;
        }
    }    

	/**
	 * Calls the function for undo or redo
	 * @param Either 'undo' or 'redo'
	 */
	fabricHistoryAction(action: string) {
		switch(action) {
			case 'undo':
				this.fabricHistoryActionUndo();
			break;

			case 'redo':
				this.fabricHistoryActionRedo();
			break;
		}
	}

	/**
	 * Go back one step
	 */
	fabricHistoryActionUndo() {
		this.fabricHistoryReplay = true;
		let self = this;
		let cb =  function() {
			self.fabricHistoryReplay = false;
		}		

		if (this.fabricHistoryMods < this.fabricHistory.length) {

			if (this.fabricHistoryMods !== 5) {
				// Clear canvas
				this.fabricCanvas.clear().renderAll();

				// Minus 1 to get previous item, minus last mod and -1 because mods is reset to 0
				let obj = this.fabricHistory[this.fabricHistory.length - 1 - this.fabricHistoryMods - 1];			
				this.fabricCanvas.loadFromDatalessJSON(obj, cb, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
				this.fabricHistoryMods += 1;
				
			} 
		}
	}

	/**
	 * Go forward one step
	 */
	fabricHistoryActionRedo() {
		this.fabricHistoryReplay = true;
		let self = this;
		let cb =  function() {
			self.fabricHistoryReplay = false;
		}			

		if ( this.fabricHistoryMods > 0 ) {
			// Clear canvas
			this.fabricCanvas.clear().renderAll();

			// Minus 1 to get previous item, minus the last mod and add one to go forward
			let obj = this.fabricHistory[this.fabricHistory.length - 1 - this.fabricHistoryMods + 1];		
			this.fabricCanvas.loadFromDatalessJSON(obj, cb, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
			this.fabricHistoryMods -= 1;
		}
	}

    /* ===================================================== */
    /* Save/Load to local storage
    /* ===================================================== */

	/**
	 * Save the canvas
	 */
	fabricSaveLocalStorage() {
		if (localStorage) {
			let obj = JSON.stringify(this.fabricCanvas.toDatalessJSON());
			localStorage.setItem('fabricCanvas', obj);
			this.fabricCanvas.renderAll();
		}
	}

	/**
	 * Load the canvas
	 */
	fabricLoadLocalStorage() {
		let self = this;
		let obj: any;
		let cb = function() {
			self.fabricHistory = [];
			self.fabricHistory.push(obj);
			self.fabricHistoryMods = 0;
			self.fabricHistoryReplay = false;
			self.fabricDisableUndoRedo();
		}		
		if (localStorage) {
			obj = localStorage.getItem('fabricCanvas');
			this.fabricCanvas.deactivateAll().clear();
			this.fabricCanvas.loadFromDatalessJSON(obj, cb, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
			this.fabricCanvas.renderAll();
		}
	}	    
}

// Run
var demo = new fabricUndoRedo();