var listFunc = function (cell, onRendered, success, cancel, editorParams) {
    let edit = this,
        table = this.table,
        input = _createInputElement(),
        listEl = _createListElement(),
        focusedItem = null,
        displayItems = [],
        event = [],
        timerId = null,
        popup = null,
        dataApp = null,
        lastAction = '';

    let blurable = true;
    //Рендер
    onRendered(function() {
        input.value = cell.getValue();
        input.focus({ preventScroll: true });
    })
    
    let actions = {
        success: success,
        cancel: cancel
    };
    function _createInputElement() {
        let input = document.createElement('input');
        input.setAttribute('type', 'search');
        input.style.padding = "4px";
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        _bindInputEvents(input);
        table.classCustomList = this;
        return input;
    }

    function _bindInputEvents(input) {
        input.addEventListener("focus", _inputFocus);
        input.addEventListener("click", _inputClick);
        input.addEventListener("blur", _inputBlur);
        input.addEventListener("keydown", _inputKeyDown);
        input.addEventListener("search", _inputSearch);
        input.addEventListener("input", _inputInput);
    }

    function _inputBlur(e) {
        if (blurable) {
            if (popup) {
                popup.hide();
                setTimeout(() => {
                    actions.cancel();
                }, 10);
            }
            else
                _resolveValue(true);
        }
    }

    function _resolveValue(blur) {
        if (blur) {
            actions.cancel();
            clearTimeout(timerId)
        }
    }
    function _inputClick(e) {
        console.log(e);
        e.stopPropagation();
    }
    function _inputFocus(e) {
        //this.rebuildOptionsList();
        //this._showList(this);
    }
    function _inputSearch(e) {
        if (!e.target.value.length) {
            _clearChoices();
        }
    }
    function _inputInput(e) {
        if (timerId)
            clearTimeout(timerId);
        if (e.target.value.length > 0) {
            timerId = setTimeout(rebuildOptionsList, 500, e.target.value);
        }
    }

    function _circleSearch() {
        listEl.innerHTML = "";
        let el = document.createElement('div');
        el.classList.add("tabulator-edit-list-placeholder");
        el.classList.add("Circle_search");
        el.style = "padding: 0;"
        //this.listEl.style = "overflow: hidden;text-align: center;padding: 5px 0;"
        //this.listEl.style.minWidth = this.cell.getElement().offsetWidth + 'px';
        listEl.appendChild(el);
        _showList();
    }
    function rebuildOptionsList(data) {
        console.log("rebuildOptionsList")
    }

    function _createListElement() {
        let listEl = document.createElement('div');
        listEl.classList.add("tabulator-edit-list");
        listEl.classList.add("tab-customList");
        listEl.style.minWidth = cell.getElement().offsetWidth + 'px';
        listEl.focus();
        listEl.addEventListener("mousedown", _preventBlur);
        listEl.addEventListener("keydown", _inputKeyDown);
        return listEl;
    }
    function _buildListError() {
        listEl.innerHTML = "";
        let el = document.createElement('div');
        el.classList.add("tabulator-edit-list-placeholder");
        el.textContent = "Результатов не найдено";
        el.addEventListener("mousedown", _preventBlur);
        el.addEventListener("click", _cancel);
        listEl.appendChild(el);
    }
    function _buildList(data) {
        listEl.innerHTML = "";
        if (data.length) {
            data.forEach((option) => {
                _buildItem(option);
            });
        }
        else
            _buildItem(data);
    }
    function _buildItem(item) {
        dataApp = item;
        let el = document.createElement('div');
        el.tabIndex = 0;
        el.classList.add("tabulator-edit-list-item");
        el.classList.add("tabulator-edit-list-group-level-0");
        el.textContent = item.name;
        el.setAttribute('data-uid', item.username);
        el.setAttribute('data-ref', item.email);

        el.addEventListener("click", _itemClick);
        el.addEventListener("mousedown", _preventBlur);

        item.element = el;
        listEl.appendChild(el);
        displayItems.push(item);
    }
    function _showList() {
        if (!popup)
            popup = edit.popup(listEl);

        popup.show(cell.getElement(), "bottom");
    }
    function _inputKeyDown(e) {
        switch (e.keyCode) {
            case 38: //up arrow
                _keyUp(e);
                break;
            case 40: //down arrow
                _keyDown(e);
                break;
            case 37: //left arrow
            case 39: //right arrow
                _keySide(e);
                break;
            case 13: //enter
                _keyEnter();
                break;
            case 27: //escape
                _keyEsc();
                break;
            case 36: //home
            case 35: //end
                _keyHomeEnd(e);
                break;
            case 9: //tab
                _keyTab(e);
                break;
        }
    }

    function _keyUp(e) {
        var index = displayItems.indexOf(focusedItem);
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        if (index > 0) {
            _focusItem(displayItems[index - 1]);
        }
        if (index == 0) {
            _focusItem(displayItems[displayItems.length - 1]);
        }
    }
    function _keyDown(e) {
        var index = displayItems.indexOf(focusedItem);
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        if (index < displayItems.length) {
            if (index == -1 || index == displayItems.length - 1)
                _focusItem(displayItems[0]);
            else {
                _focusItem(displayItems[index + 1]);
            }
        }
    }
    function _keySide(e) {

    }
    function _keyEnter() {
        if (focusedItem) {
            _chooseItem(focusedItem);
        }
    }
    function _keyEsc(e) {
        _cancel();
    }
    function _keyHomeEnd(e) {
        e.stopImmediatePropagation();
    }

    function _keyTab(e) {
        _cancel();
    }
    function _preventBlur(e) {
        blurable = false;
        setTimeout(() => {
            blurable = true;
        }, 10);
        //this._cancel()
        //this._chooseItem(e.target);
    }
    function _focusItem(item) {
        lastAction = 'focus'

        if (focusedItem && focusedItem.element) {
            focusedItem.element.classList.remove("focus");
        }

        focusedItem = item;
        if (item && item.element) {
            item.element.classList.add("focus");
            item.element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
    }
    function _itemClick() {
        console.log();
        console.log(event);
        /*
        e.stopPropagation();
        _chooseItem(e.target);
        */
    }
    function _chooseItem(item) {
        console.log("_chooseItem")
    }
    function _clearChoices() {
        if (focusedItem && focusedItem.element) {
            focusedItem.element.classList.remove("focus");
        }
        else {
            console.log("_clearChoices");
        }
        focusedItem = null;
    }

    function _clearList() {
        while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
        displayItems = [];
    }
    function _cancel() {
        if (popup) {
            popup.hide();
            _clearList()
        }
        actions.cancel();
    }
    function on(e, callback) {
        listEl.addEventListener(e, function (e) {
            if (e.type == "saveChange")
                return callback(e.detail.cell, e.detail.row, e.detail.table, e.detail.element, e.detail.data, e.detail.dataApp);
        })
    }

    return input;
}
