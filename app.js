/**
 * Created by kra on 6/12/2017.
 */
function createStore(reducer, initState){

    // this is our store's state
    var list = initState || {
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
            return list;
        },
        /**
         * @description activate the reducer
         * @param action
         */
        dispatch: function(action){
            list = reducer(list, action);
            for (var i = 0; i < events.length; i++){
                events[i](list, action);
            }
        },
        subscribe: function(cb){
            events.push(cb);
        },
        unsubscribe: function(index){
            events.splice(index, 1);
        }
    }
}

function listReducer(lastState, action){

    // create in a new variable in order to prevent sending a new object when no change happened
    var newState = JSON.parse(JSON.stringify(lastState)); // simple naive clone... better to use lodash :)
    switch(action.type){
        case "ADD_ITEM":
            newState.list.push(action.payload);
            break;
        case "DELETE_ITEM":
            newState.list.splice(newState.indexOf(action.payload), 1);
            break;
        case "DELETE_ITEM_BY_INDEX":
            newState.list.splice(action.payload, 1);
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
            return lastState;
    }
    return newState;
}

// since we have no angular/react, we do it "manually" with jQuery...
function listViewHandler(state) {
    if (typeof $ === 'undefined') {
        return;
    }
    var listHtml = '';
    for (var i = 0; i < state.list.length; i++) {
        listHtml += '<li onclick="selectItem()" data-index="' + i + '" class="list-item">' + state.list[i] + '</li>';
    }
    $('#list').html(listHtml);
    
    $($('#list').children()[state.selected]).addClass('selected');
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
        payload: myStore.getState().selected
    });
}

var INIT_STATE = {
    selected: 1,
    list: ['Yuval', 'Arbel']
};

var myStore = createStore(listReducer, INIT_STATE);

myStore.subscribe(listViewHandler);
