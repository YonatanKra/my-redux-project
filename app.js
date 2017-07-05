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

function createStore(reducer, initState, middlewares) {

    // this is our store's state
    var state = initState || {
            selected: undefined, // the selected index
            list: [] //list of strings
        };
    var events = [];

    var store = {
        /**
         * @description just return the stae
         * @returns {*|Array}
         */
        getState: function () {
            return deepClone(state);
        },
        /**
         * @description activate the reducer
         * @param action
         */
        dispatch: function (action) {
            state = reducer(state, action);

            for (var i = 0; i < events.length; i++) {
                events[i](state, action);
            }
        },
        /**
         * @description subscribes to store events.  Also triggers callback with current state. Can be disabled by sending getLatest
         * @param cb - {Function}
         * @param getLatest - {Boolean}
         */
        subscribe: function (cb, getLatest) {
            events.push(cb);
            if (!getLatest) {
                cb(this.getState()); //the new subscriber would get the current state
            }
        },
        unsubscribe: function (index) {
            events.splice(index, 1);
        }
    }

    if (typeof middlewares !== 'undefined'){
        return applyMiddleware(store, middlewares);
    }

    return store;
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

function applyMiddleware(store, middlewares) {
    // copy the middlewares
    middlewares = middlewares.slice();

    // reverse the order
    middlewares.reverse();

    // save the original dispatch
    var dispatch = store.dispatch;

    // for each middleware, apply the chain
    middlewares.forEach(function(middleware) {
        dispatch = middleware(store)(dispatch);
        }
    );

    // override the store's dispatch with the first middleware (remember the reverse?)
    return Object.assign({}, store, { dispatch: dispatch });
}

function listApp(){
    return {
        requests: requestsReducer,
        list: listReducer
    };
}

function requestsReducer(lastState, action) {
    var newState = deepClone(lastState);
    switch (action.type) {
        case "REQUEST":
            newState.requesting = true;
            newState.success = undefined;
            break;
        case "REQUEST_SUCCESS":
            newState.requesting = false;
            newState.success = true;
            break;
        case "REQUEST_FAILURE":
            newState.requesting = false;
            newState.success = false;
            break;
        default:
            return lastState;
    }

    return newState;
}

/**
 * @description a middleware that allows to send functions as an action
 * @param store
 * @returns {Function}
 */
function functionMiddleware(store) {
    return function (dispatch) {
        return function (action) {

            if (typeof action === 'function'){
                return action(dispatch);
            }

            // it expects the dispatcher to return an action
            return dispatch(action);
        }
    }
}

/**
 * @description a middleware that handles our data fetch
 * @param jsonUrl - {String]
 * @returns {Function}
 */

function fetchData(jsonUrl) {
    return function (dispatch) {
        // notify everyone we are requesting data
        dispatch({
            type: "REQUEST"
        });

        // now fetch the data
        fetch(jsonUrl)
            .then(function (response) {
                // if ok, return the json
                if (response.ok) {
                    return response.blob();
                }
                // if not ok, dispatch the error event
                dispatch({
                    type: "REQUEST_FAILURE"
                })
            })
            .then(function (responseJson) {
                if (typeof responseJson === 'undefined'){
                    return;
                }
                // dispatch the success with the recieved data
                dispatch({
                    type: "REQUEST_SUCCESS",
                    payload: responseJson
                })
            })
    }
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

var myStore = createStore(combineReducers(listApp()), INIT_STATE, [functionMiddleware]);

myStore.subscribe(listViewHandler);
