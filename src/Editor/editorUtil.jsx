//import {uploadImage} from '@zionex/wingui-core/utils/common'

export function handleImageDrop(view, event, slice, moved,uploadImage) {
    if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) { // if dropping external files
      let file = event.dataTransfer.files[0]; // the dropped file
      let filesize = ((file.size/1024)/1024).toFixed(4); // get the filesize in MB
      if ((file.type === "image/jpeg" || file.type === "image/png") && filesize < 10) { // check valid image type under 10MB
        // check the dimensions
        let _URL = window.URL || window.webkitURL;
        let img = new Image(); /* global Image */
        img.src = _URL.createObjectURL(file);
        img.onload = function () {
          if (this.width > 5000 || this.height > 5000) {
            window.alert("Your images need to be less than 5000 pixels in height and width."); // display alert
          } else {
            if(!uploadImage) {
              let image = new Image();
                image.src = img.src;
                image.onload = function() {
                  // place the now uploaded image in the editor where it was dropped
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  const node = schema.nodes.imageResize.create({ src: response.data }); // creates the image element
                  const transaction = view.state.tr.insert(coordinates.pos, node); // places it in the correct position
                  return view.dispatch(transaction);
                }
            }
            else {
              uploadImage(file).then(function(response) { // response is the image url for where it has been saved
                // pre-load the image before responding so loading indicators can stay
                // and swaps out smoothly when image is ready
                let image = new Image();
                image.src = response.data;
                image.onload = function() {
                  // place the now uploaded image in the editor where it was dropped
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  const node = schema.nodes.imageResize.create({ src: response.data }); // creates the image element
                  const transaction = view.state.tr.insert(coordinates.pos, node); // places it in the correct position
                  return view.dispatch(transaction);
                }
              }).catch(function(error) {
                  console.log("There was a problem uploading image" , error)
              });
            }
          }
        };
      } else {
        window.alert("Images need to be in jpg or png format and less than 10mb in size.");
      }
      return true; // handled
    }
    return false; // not handled use default behaviour
  }