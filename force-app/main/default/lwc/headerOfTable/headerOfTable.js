import { LightningElement,api } from 'lwc';
export default class HeaderOfTable extends LightningElement {
    @api heading;
    // @api isHeader;
    @api headerIcon;
    // @api currentPage;
    // @api pageSize;
    // @api totalRecords;
    // @api totalPages;
    //
    // @api hideBottom;

    connectedCallback() {
        console.log('Header Page');
        
    }
}