import { LightningElement,api } from 'lwc';
export default class CustomPaginationComponent extends LightningElement {
    @api pageSizeOptions;
    @api isBottomOfPagination;
    @api currentPage;
    @api pageSize;
    @api totalRecords;
    @api totalPages;
    @api isHeader;
    @api hideBottom;
    @api pageNumber;
    @api bDisableLast;
    @api bDisableFirst;

    connectedCallback() {
        console.log('Pagination Component call');
    }
    handleFirst() {
        this.dispatchEvent(new CustomEvent('clickfirstpage',{
        }));
    }
     handleLast() {
        this.dispatchEvent(new CustomEvent('clicklastpage', {
        }));
    }
     handlePrev() {
        this.dispatchEvent(new CustomEvent('clickprevpage', {
        }));
    }
     handleNext() {
        this.dispatchEvent(new CustomEvent('clicknextpage', {
        }));
    }
    handleRandomClick(event) {
        this.dispatchEvent(new CustomEvent('clickrandompage', {
            detail: {
                pagevalue:event.target.label,
            }
        }));
    }
    handleChangeInRow(event){
        console.log('Handle Changes in row---->',event.target.value);
          this.dispatchEvent(new CustomEvent('changepagesize', {
            detail: {
                pagevalue:event.target.value,
            }
        }));
    }
}