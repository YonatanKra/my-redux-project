/**
 * Created by kra on 6/12/2017.
 */
function createStore(reducer, initState){

    // this is our store's state
    var list = initState || []; //list of strings
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
            newState.push(action.payload);
            break;
        case "DELETE_ITEM":
            newState.splice(newState.indexOf(action.payload), 1);
            break;
        case "DELETE_ITEM_BY_INDEX":
            newState.splice(action.payload, 1);
            break;
        case "RESET":
            return [];
        default:
            return lastState;
    }
    return newState;
}

var INIT_STATE = ['Yuval', 'Arbel'];

var myStore = createStore(listReducer, INIT_STATE);

console.log(myStore.getState());

myStore.dispatch({
    type: "ADD_ITEM",
    payload: "Maor700-Superpower"
});

console.log(myStore.getState());

myStore.dispatch({
    type: "DELETE_ITEM_BY_INDEX",
    payload: 2
});

console.log(myStore.getState());