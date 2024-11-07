// * api features
class APIFeatures {
  constructor(query, qString) {
    this.query = query;
    this.qString = qString;
  }

  filter() {
    // 1. Filtering
    const queryObjCopy = { ...this.qString };
    const excludedFields = ['sort', 'page', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObjCopy[el]);

    // 2. Advanced filtering - Convert operators (e.g., gte, gt, lte, lt) in the query string to MongoDB query operators
    let qStringAdvance = JSON.stringify(queryObjCopy);
    qStringAdvance = qStringAdvance.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // 3. Parse the modified query string to construct the MongoDB query object
    const qStringAdvanceParsed = JSON.parse(qStringAdvance);

    this.query = this.query.find(qStringAdvanceParsed);

    return this; // Return the entire object to allow chaining
  }

  sort() {
    // 1. Sorting if the sort option is present
    if (this.qString.sort) {
      // 2. Remove the comma and sort by the parameters that we have
      const sortBy = this.qString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);

      // 3. Sorting by default if the sort option is not present
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this; // Return the entire object
  }

  sortByFields() {
    // 1. Sorting if the fields option is present
    if (this.qString.fields) {
      // 2. Remove the comma and sort only by the fields that we have
      const sortFieldsBy = this.qString.fields.split(',').join(' ');
      this.query = this.query.select(sortFieldsBy);

      // Exclude this fucking shit
      // this.query = this.query.select('-_id');

      // 3. Sorting by default if the fields option is not present
    } else {
      this.query = this.query.select('-__v');
    }

    return this; // Return the entire object
  }

  paginate() {
    // Get page and limit from user, ensure that the values is always valid, in case user didn't pass this values
    const page = this.qString.page * 1 || 1; // set the 1 as default
    const limit = this.qString.limit * 1 || 100; // set to 100 as default
    const skip = (page - 1) * limit; // (e.g. (page - 1) * limit => (2 - 1) * 10 => page 11-20)

    this.query = this.query.skip(skip).limit(limit);

    return this; // Return the entire object
  }
}
module.exports = APIFeatures;
