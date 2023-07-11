import { LightningElement,api } from 'lwc';
export default class SpinnerComponent extends LightningElement {
@api showLoading;
connectedCallback() {
    console.log('show loading==',this.showLoading);
}
}