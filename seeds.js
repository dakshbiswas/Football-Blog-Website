var mongoose = require("mongoose");
var Blog = require("./models/blog");
var Comment = require("./models/comment");

var data = [
  {
    title: "Lionel Messi",
    image:"https://en.as.com/en/imagenes/2020/06/12/football/1591968491_909733_noticia_normal.jpg",
    body: "Lionel Andrés Messi Cuccittini (Spanish pronunciation: [ljoˈnel anˈdɾez ˈmesi] ( listen); born 24 June 1987) is an Argentine professional footballer who plays as a forward and captains both Spanish club Barcelona and the Argentina national team."
  },
  {
    title: "CR7",
    image:"https://www.thestatesman.com/wp-content/uploads/2019/11/Ronaldo-9.jpg",
    body: "Cristiano Ronaldo dos Santos Aveiro GOIH ComM (European Portuguese: [kɾiʃˈtjɐnu ʁɔˈnaɫdu]; born 5 February 1985) is a Portuguese professional footballer who plays as a forward for Serie A club Juventus and captains the Portugal national team. Often considered the best player in the world and widely regarded as one of the greatest players of all time,[note 3] Ronaldo has won five Ballons d'Or[note 4] and four European Golden Shoes, both of which are records for a European player. "
  },
  {
    title: "Neymar Jr",
    image:"https://i.dailymail.co.uk/1s/2019/12/13/09/22195712-7788805-image-a-14_1576229930825.jpg",
    body: "Neymar da Silva Santos Júnior (Brazilian Portuguese: [nejˈmaʁ dɐ ˈsiwvɐ ˈsɐ̃tus ˈʒũɲoʁ]; born 5 February 1992), known as Neymar, is a Brazilian professional footballer who plays as a forward for Ligue 1 club Paris Saint-Germain and the Brazil national team."
  }
]

function seedDB(){
  // remove all existing blogs
Blog.remove({},function(err){
  if(err){
    console.log(error);
  } else {
    console.log("removed blogs");
    // Add some seed blogs from the data variable created above
    data.forEach(function(seed){
      Blog.create(seed,function(err,blog){
        if(err){
          console.log("error seed");
        } else {
          console.log("Seed blog created");
          // create a comment
          Comment.create({
            text: "The Greatest Of All Time",
            author: "Nedu"
          },function(err, comment){
            if(err){
              console.log(err);
            } else {
              blog.comments.push(comment);
              blog.save();
              console.log("Created a comment");
            }
          })
        }
      })
    })
  }
});
}

module.exports = seedDB;
