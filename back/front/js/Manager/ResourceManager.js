///////////////////////////
/// 3d objects resource ///
///////////////////////////
export const Resource = {
  _model : {},
  getModel(name){
    return this._model[name];
  },
  setModel(name,model){
    this._model[name] = model;
  }
};
