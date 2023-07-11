import { LightningElement, api, track } from 'lwc';
import getpriceBookName from '@salesforce/apex/ProductUtility.getpriceBookName';
import getProductFromPriceBookId from '@salesforce/apex/ProductUtility.getProductFromPriceBookId';
export default class FilterList extends LightningElement {
    @api selectedPriceBookId = '';
    @track priceBookNameOption = [];
    @track selectedPriceBookId = '';

    connectedCallback() {
        this.pricebookVal = this.value;
        const tempObj = [];
        getpriceBookName({})
            .then((result) => {
                tempObj.push({
                    label: 'All Price Books',
                    value: 'all'
                });
                for (var key in result) {
                    tempObj.push({ label: result[key].Name, value: result[key].Id });
                }
                this.priceBookNameOption = tempObj;
                console.log('PriceBook Name==>',this.priceBookNameOption);
            }).catch((err) => {

            });
    }

    onClose() {
        this.dispatchEvent(new CustomEvent('closefilter', {}));
    }

    handlePriceBookCHange(event) {
        console.log('change-->', event.target.value);
        this.selectedPriceBookId = event.target.value;
    }

    handleSaveFilter() {        
        const filterValue = new CustomEvent("getfiltervalue", { detail:  this.selectedPriceBookId });
        this.dispatchEvent(filterValue);
        this.onClose();
    }

}