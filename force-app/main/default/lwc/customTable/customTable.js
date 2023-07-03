import { LightningElement, api, track } from 'lwc';
export default class CustomTable extends LightningElement {
    @api tHead;
    @api allRecords;
    @api pageSizeOptions;
    @api pageSize;
    @api isPagination;
    @api heading;
    @api isHeader;
    @api headerIcon;
    @api currentPage;
    @api totalRecords;
    @api totalPages;
    @api pageNumber;
  

    connectedCallback() {
        console.log('pageSizeOptions--->',JSON.stringify(this.pageSizeOptions));
        console.log('headerIcon===>',this.headerIcon);
        console.log('totalPages-->',this.totalPages);
        console.log('totalRecords-->',JSON.stringify(this.allRecords));
        console.log('Custom Table isHeader-->',this.isHeader);
    }
}