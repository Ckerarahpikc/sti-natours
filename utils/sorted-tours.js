class SortTours {
  constructor(request) {
    this.request = { ...request };
  }

  sortRandom() {
    const posibilitySorting = [
      'sort=duration&fields=duration,maxGroupSize,ratingsAverage,price,description,createdAt&page=4&limit=2',
      'sort=maxGroupSize&fields=duration,maxGroupSize,ratingsQuantity,price,summary,images&page=1&limit=6',
      'sort=difficulty&fields=duration,difficulty,price,ratingsAverage,createdAt,startDates&page=2&limit=4',
      'sort=ratingsAverage&fields=duration,maxGroupSize,ratingsAverage,price,images,createdAt&page=4&limit=2',
      'sort=difficulty&fields=duration,maxGroupSize,price,summary,imageCover,createdAt,startDates&page=1&limit=5',
      'sort=price&fields=duration,price,ratingsAverage,imageCover,createdAt,startDates&page=3&limit=3',
      'sort=ratingsQuantity&fields=duration,maxGroupSize,ratingsQuantity,price,summary,startDates&page=1&limit=6',
      'sort=duration&fields=duration,difficulty,maxGroupSize,ratingsAverage,price,description,imageCover,createdAt&page=2&limit=4',
      'sort=summar&fields=duration,difficulty,ratingsAverage,summary,createdAt,startDates&page=1&limit=7',
      'sort=countOfImages&fields=duration,price,images,createdAt,startDates&page=1&limit=5'
    ];
    const cloneResult = this.request;
    const firstPossible =
      posibilitySorting[Math.floor(Math.random() * posibilitySorting.length)];
    firstPossible.split('&').forEach((el) => {
      const [key, value] = el.split('=');
      cloneResult[key] = value;
    });
    console.log('cloneResult:', cloneResult);
    return cloneResult;
  }

  /// and more here...
}
module.exports = SortTours;
