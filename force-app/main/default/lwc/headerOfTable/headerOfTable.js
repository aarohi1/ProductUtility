import { LightningElement,api } from 'lwc';
export default class HeaderOfTable extends LightningElement {
    @api heading;
    @api headerIcon;
}