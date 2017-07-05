/**
 * Created by kra on 6/12/2017.
 */
function deepClone(obj, state, property, value){
    // clone the whole state
    if (typeof property === 'undefined'){
        return JSON.parse(JSON.stringify(obj));
    }

    // clone only what we need
    var x = {};
    if (property.constructor === Array){
        for (var i = 0; i < property.length; i++){
            x[property[i]] = {};
        }
        property = property[i];
    }
    x[property] = value;
    return Object.assign({}, state, x);
}

function createStore(reducer, initState){

    // this is our store's state
    var state = initState || {
            selected: undefined, // the selected index
            list: [] //list of strings
        };
    var events = [];

    return {
        /**
         * @description just return the stae
         * @returns {*|Array}
         */
        getState: function(){
            return deepClone(state);
        },
        /**
         * @description activate the reducer
         * @param action
         */
        dispatch: function(action){
            state = reducer(state, action);

            for (var i = 0; i < events.length; i++){
                events[i](state, action);
            }
        },
        /**
         * @description subscribes to store events.  Also triggers callback with current state. Can be disabled by sending getLatest
         * @param cb - {Function}
         * @param getLatest - {Boolean}
         */
        subscribe: function(cb, getLatest){
            events.push(cb);
            if (!getLatest){
                cb(this.getState()); //the new subscriber would get the current state
            }
        },
        unsubscribe: function(index){
            events.splice(index, 1);
        }
    }
}

function combineReducers(reducers){
    var keys = Object.keys(reducers);

    return function(state, action){
        var nextState = {};
        var previousState;
        var reducer;
        var key;
        var changed = false;
        for (var i = 0; i < keys.length; i++){
            key = keys[i];
            previousState = state[key];
            reducer = reducers[key];
            nextState[key] = reducer(previousState, action);

            changed = nextState[key] !== previousState;
        }

        // if there was a change, return the next state. Otherwise, return the old state.
        return changed ? nextState : state;
    }
}

function listApp(){
    return {
        requests: requestsReducer,
        list: listReducer
    };
}

function requestsReducer(lastState, action){
    var newState = deepClone(lastState);
    switch (action.type){
        case "REQUEST":
            break;
        default:
            return lastState;
    }

    return newState;
}

/**
 * @description gets a state, and handles it according to the action. Returns original state if no valid action was sent.
 * @param lastState
 * @param action
 * @returns {*}
 */
function listReducer(lastState, action){

    var newState = deepClone(lastState);
    // act according to action
    switch(action.type){
        case "ADD_ITEM":
            newState.list.push(action.payload);
            break;
        case "DELETE_ITEM":
            var index = newState.list.indexOf(action.payload);
            newState.list.splice(index, 1);
            if (index === newState.selected){
                newState.selected = undefined;
            }else if (newState.selected > index){
                newState.selected -= 1;
            }
            break;
        case "DELETE_ITEM_BY_INDEX":
            if (typeof action.payload === 'undefined'){
                return lastState; // an action with invalid argument is an invalid action and nothing changed
            }
            newState.list.splice(action.payload, 1);

            if (newState.selected === action.payload) {
                newState.selected = undefined;
            }else if (newState.selected > action.payload){
                newState.selected -= 1;
            }
            break;
        case "SELECT":
            newState.selected = action.payload;
            break;
        case "RESET":
            return {
                selected: undefined,
                list: []
            };
        default:
            // if no action was taken, return undefined, and the state would not be changed + no subscription will fire (since no actions was taken)
            return lastState;
    }
    return newState;
}

// since we have no angular/react, we do it "manually" with jQuery...
function listViewHandler(state) {
    if (typeof $ === 'undefined') {
        return;
    }
    var listItems = state.list.list;
    var listHtml = '';
    for (var i = 0; i < listItems.length; i++) {
        listHtml += '<li onclick="selectItem()" data-index="' + i + '" class="list-item">' + listItems[i] + '</li>';
    }
    var list = $('#list');
    list.html(listHtml);
    
    $(list.children()[state.list.selected]).addClass('selected');
}

function selectItem(){
    myStore.dispatch({
        type: "SELECT",
        payload: event.target.dataset.index
    });
}

function addItemButton() {
    var payload = $('#list-item').val();
    if (payload === '') {
        return;
    }

    myStore.dispatch({
        type: "ADD_ITEM",
        payload: payload
    });
}

function deletItem(){
    myStore.dispatch({
        type: "DELETE_ITEM_BY_INDEX",
        payload: myStore.getState().list.selected
    });
}

var INIT_STATE = {
    list: {
        selected: 1,
        list: ['Yuval', 'Arbel']
    },
    requests: {
        requesting: false
    }

};

var myStore = createStore(combineReducers(listApp()), INIT_STATE);

myStore.subscribe(listViewHandler);
