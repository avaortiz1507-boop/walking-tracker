class OrderHistoryStack {
    constructor() {
        this.items = [];
    }
    // add an order to the stack
    push(order) {
        this.items.push(order);
    }
    // remove and return the most recent order from the stack
    pop() {
        return this.items.pop();
    }
    // return the most recent order without removing it from the stack
    peek() {
        const index = this.items.length - 1;
        console.log('index', index)
        return this.items[index];
        // return this.items[this.items.length - 1];
    }
}


class OrderQueue{

}