class APIFeatures {
    // query - query pochodzące z mongoose
    // queryString - łańcuch znaków request (ex. price[gt]=1000&page=2&limit=10)
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };

        // parametry w adresie które nie stanowią kryterium filtrowania
        const execludedFields = ['page', 'sort', 'limit', 'fields'];

        // usuwamy z queryObj pola zdefiniowane w execludedFields
        execludedFields.forEach(el => delete queryObj[el]);
        // Advanced filtering
        // przetwarzanie operatorów ex. gt -> $gt
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(eq|gt|gte|in|lt|lte|ne|nin)\b/g,
            match => `$${match}`
        );

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            // ex. 'sort=-createdAt,price' -> '-createdAt price'
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            // ex. 'fields=name,price' -> 'name price'
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    pagination() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        // page=2&limit=10, page 1: 1-10, page 2: 11-20, page 3: 21-30
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
