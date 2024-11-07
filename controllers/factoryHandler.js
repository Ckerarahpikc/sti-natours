const SetAppError = require('./../utils/errorConfig');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/api-features');
const filterBody = require('./../utils/fileBodyRquiredFieldsOnly');

// ^ DELETE / ERACE
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // info: Deleting the Model
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(
        new SetAppError("Couldn't find that document to delete.", 404)
      );

    res.status(204).json({
      status: 'Successfully deleted.',
      data: null
    });
  });

// ^ CREATE / POST
exports.createOne = (Model, ...filterThis) =>
  catchAsync(async (req, res, next) => {
    // filter the body
    let filter;
    if (filterThis.length !== 0) {
      filter = filterBody(req.body, ...filterThis);
    }

    let doc;
    let modelName =
      'new' +
      Model.modelName.charAt(0).toUpperCase() +
      Model.modelName.substring(1).toLowerCase();
    doc = await Model.create(filter ? filter : req.body);
    // await Model.save(); this is not a function

    res.status(201).json({
      status: 'success',
      data: {
        [modelName]: doc
      }
    });
  });

// ^ GET
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // info: Getting doc by ID
    let query = await Model.findById(req.params.id);

    if (!query) {
      return next(
        new SetAppError(
          `Couldn't find the ${Model.modelName.toLowerCase()} with this ID.`,
          404
        )
      );
    }

    // if there is any populate options then simply just execute them
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    res.status(200).json({
      status: 'success',
      createdTime: req.requestTimestamp,
      data: {
        [Model.modelName]: doc
      }
    });
  });
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    // note: so if there is not filter, we just pass '{}' into find
    if (req.params.tourId) filter = { tour: req.params.tourId };
    let modelName = Model.modelName.toLowerCase();
    let modelNameLength = Model.modelName.toLowerCase() + 'Count';

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .sortByFields()
      .paginate();

    // waiting for the query sorting
    // doc = await features.query.explain();
    doc = await features.query;

    res.status(200).json({
      status: 'success',
      data: {
        [modelNameLength]: doc.length,
        [modelName]: doc
      }
    });
  });

// ^ PATCH / PUT / UPDATE
exports.updateOne = (Model, ...filterThis) =>
  catchAsync(async (req, res, next) => {
    try {
      const filtered = filterBody(req.body, ...filterThis);

      let doc;
      let modelName =
        'updated' +
        Model.modelName.charAt(0).toUpperCase() +
        Model.modelName.substring(1).toLowerCase();

      if (Object.entries(req.body).length === 0) {
        throw new Error('Body is empty. Check again, then run. ;)');
      }

      doc = await Model.findByIdAndUpdate(req.params.id, filtered, {
        new: true,
        runValidators: true
      });

      // check if the tour is 'null' and call an Error
      if (!doc) {
        return next(new SetAppError(`Couldn't update ${modelName}.`, 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          [modelName]: doc
        }
      });
    } catch (err) {
      return next(new SetAppError(err, 400));
    }
  });
