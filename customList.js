function CustomListClass(editor, cell, onRendered, success, cancel, editorParams) {
    return class {
        constructor() { 
            this.edit = editor;
            this.table = editor.table;
            this.cell = cell;

            this.input = this._createInputElement();
            this.listEl = this._createListElement();

            this.focusedItem = null;
            this.displayItems = [];
            this.event = [];
            this.timerId = null;
            this.popup = null;
            this.dataApp = null;
            this.dataJson = [];
            this.blurable = true;

            this.lastAction = '';
            this.dataField = '';
            //Рендер
            onRendered(
                this._onRendered.bind(this)
            )

            this.actions = {
                success: success,
                cancel: cancel
            };
        }

        _onRendered() {
            if (this.cell.getValue())
                this.input.value = this.cell.getValue();
            else
                this.input.value = '';
            this.input.style.height = "100%";
            this.input.focus({ preventScroll: true });
        }

        _createInputElement() {
            let input = document.createElement('input');
            input.setAttribute('type', 'search');
            input.style.padding = "4px";
            input.style.width = "100%";
            input.style.boxSizing = "border-box";
            this._bindInputEvents(input);
            this.table.classCustomList = this;
            return input;
        }

        _bindInputEvents(input) {
            input.addEventListener("focus", this._inputFocus.bind(this));
            input.addEventListener("click", this._inputClick.bind(this));
            input.addEventListener("blur", this._inputBlur.bind(this));
            input.addEventListener("keydown", this._inputKeyDown.bind(this));
            input.addEventListener("search", this._inputSearch.bind(this));
            input.addEventListener("input", this._inputInput.bind(this));
        }
        _inputBlur(e) {
            if (this.blurable) {
                if (this.popup) {
                    this.popup.hide();
                    setTimeout(() => {
                        this.actions.cancel();
                    }, 10);
                }
                else
                    this._resolveValue(true);
            }
        }

        _resolveValue(blur) {
            if (blur) {
                this.actions.cancel();
                clearTimeout(this.timerId)
            }
        }
        _inputClick(e) {
            e.stopPropagation();
        }
        _inputFocus(e) {
            this.input.dispatchEvent(new CustomEvent("beginningInput"));
            //console.log("da");
            //this.rebuildOptionsList();
            //this._showList(this);
        }
        _inputSearch(e) {
            if (!e.target.value.length) {
                this._clearChoices();
            }
        }
        _inputInput(e) {
            if (this.timerId)
                clearTimeout(this.timerId);
            if (e.target.value.length > 0) {
                this.timerId = setTimeout(this.rebuildOptionsList.bind(this), 500, e.target.value);
            }
        }
        _circleSearch() {
            this.listEl.innerHTML = "";
            let el = document.createElement('div');
            el.classList.add("tabulator-edit-list-placeholder");
            el.classList.add("Circle_search");
            el.style = "padding: 0;"
            //this.listEl.style = "overflow: hidden;text-align: center;padding: 5px 0;"
            //this.listEl.style.minWidth = this.cell.getElement().offsetWidth + 'px';
            this.listEl.appendChild(el);
            this._showList();
        }
        rebuildOptionsList(data) {
            this.input.dispatchEvent(new CustomEvent("endInput",{detail: {data:data}}));
        }

        searchUser(data, dataField){
            if (dataField)
                this.dataField = dataField;
            this._circleSearch();
            data.then(json => {
                if (typeof(json) != 'object')
                    json = JSON.parse(json);
                if (Object.values(json).length >0)
                    this._buildList(json);                
                else
                    this._buildListError();
            }).then(res => {
                this._showList(this);
            })
        }
        
        _createListElement() {
            let listEl = document.createElement('div');
            listEl.classList.add("tabulator-edit-list");
            listEl.classList.add("tab-customList");
            listEl.style.minWidth = this.cell.getElement().offsetWidth + 'px';
            listEl.focus();
            listEl.addEventListener("mousedown", this._preventBlur.bind(this));
            listEl.addEventListener("keydown", this._inputKeyDown.bind(this));
            return listEl;
        }
        _buildListError() {
            this.listEl.innerHTML = "";
            let el = document.createElement('div');
            el.classList.add("tabulator-edit-list-placeholder");
            el.textContent = "Результатов не найдено";
            el.addEventListener("mousedown", this._preventBlur.bind(this));
            el.addEventListener("click", this._cancel.bind(this));
            this.listEl.appendChild(el);
        }
        _buildList(data) {
            this.listEl.innerHTML = "";
            if (data.length) {
                data.forEach((option) => {
                    this._buildItem(option);
                });
            }
            else
                this._buildItem(data);
        }
        _buildItem(item) {
            this.dataApp = item;
            let el = document.createElement('div');
            el.tabIndex = 0;
            el.classList.add("tabulator-edit-list-item");
            el.classList.add("tabulator-edit-list-group-level-0");
            el.textContent = item[this.dataField];
            el.addEventListener("click", this._itemClick.bind(this, item));
            el.addEventListener("mousedown", this._preventBlur.bind(this));

            item.element = el;
            this.listEl.appendChild(el);
            this.displayItems.push(item);
        }
        _showList() {
            if (!this.popup)
                this.popup = this.edit.popup(this.listEl);

            this.popup.show(this.cell.getElement(), "bottom");
        }
        _inputKeyDown(e) {
            switch (e.keyCode) {
                case 38: //up arrow
                    this._keyUp(e);
                    break;
                case 40: //down arrow
                    this._keyDown(e);
                    break;
                case 37: //left arrow
                case 39: //right arrow
                    this._keySide(e);
                    break;
                case 13: //enter
                    this._keyEnter();
                    break;
                case 27: //escape
                    this._keyEsc();
                    break;
                case 36: //home
                case 35: //end
                    this._keyHomeEnd(e);
                    break;
                case 9: //tab
                    this._keyTab(e);
                    break;
            }
        }

        _keyUp(e) {
            var index = this.displayItems.indexOf(this.focusedItem);
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();

            if (index > 0) {
                this._focusItem(this.displayItems[index - 1]);
            }
            if (index == 0) {
                this._focusItem(this.displayItems[this.displayItems.length - 1]);
            }
        }
        _keyDown(e) {
            var index = this.displayItems.indexOf(this.focusedItem);
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            if (index < this.displayItems.length) {
                if (index == -1 || index == this.displayItems.length - 1)
                    this._focusItem(this.displayItems[0]);
                else {
                    this._focusItem(this.displayItems[index + 1]);
                }
            }
        }
        _keySide(e) {

        }
        _keyEnter() {
            if (this.focusedItem) {
                this._chooseItem(this.focusedItem);
            }
        }
        _keyEsc(e) {
            this._cancel();
        }
        _keyHomeEnd(e) {
            e.stopImmediatePropagation();
        }

        _keyTab(e) {
            this._cancel();
        }
        _preventBlur(e) {
            this.blurable = false;
            setTimeout(() => {
                this.blurable = true;
            }, 10);
            //this._cancel()
            //this._chooseItem(e.target);
        }
        _focusItem(item) {
            this.lastAction = 'focus'

            if (this.focusedItem && this.focusedItem.element) {
                this.focusedItem.element.classList.remove("focus");
            }

            this.focusedItem = item;
            if (item && item.element) {
                item.element.classList.add("focus");
                item.element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            }
        }
        _itemClick(item, e) {
            e.stopPropagation();
            this._chooseItem(item);
        }
        _chooseItem(item) {
            this.focusedItem = item.element;
            this.listEl.dispatchEvent(new CustomEvent("chooseItem",{detail: {data:item}}));
        }
        chooseItem(data){
            let row = this.cell.getRow();
            let promise = new Promise((resolve, reject) => {
                resolve(data);
            }).then(json=>{
                row.update(json).then((e) => {
                    this.listEl.dispatchEvent(new CustomEvent("saveChange",{detail:{cell: this.cell, row: row, table: this.table, data: json, element:this.focusedItem}}))
                }).then(e=> this._cancel())
                .then(e=> this.table.classCustomList = null);
            })
        }

        _clearChoices() {
            if (this.focusedItem && this.focusedItem.element) {
                this.focusedItem.element.classList.remove("focus");
            }
            else {
                console.log("_clearChoices");
            }
            this.focusedItem = null;
        }

        _clearList() {
            while (this.listEl.firstChild) this.listEl.removeChild(this.listEl.firstChild);
            this.displayItems = [];
        }
        _cancel() {
            if (this.popup) {
                this.popup.hide();
                this._clearList()
            }
            this.actions.cancel();
        }
        on(e, callback) {
            //После изменения значения
            if (e == 'saveChange'){
                this.listEl.addEventListener(e, function (e) {
                    return callback(e.detail.cell, e.detail.row, e.detail.table, e.detail.data, e.detail.element);
                });
            }

            //Когда выбрано
            if (e =='chooseItem'){
                this.listEl.addEventListener(e, function (e) {
                    return callback(e.detail.data);
                });
            }
            
            //После окончание ввода
            if (e == 'endInput'){
                this.input.addEventListener(e, function (e) {
                    return callback(e.detail.data);
                });
            }

            //Начало ввода
            if (e == 'beginningInput'){
                this.input.addEventListener(e, function (e) {
                    return callback(e.target.value, e.target);
                })
            }
        }
    }
}
