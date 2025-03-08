import React from "react";
import "./about.css";

const sections = [
  {
    title: "Welcome to Our Recipe Collection",
    text: "Explore a world of delicious flavors with our carefully curated recipes. Whether you're a seasoned chef or a beginner, we have something for everyone!",
    image: "https://images.squarespace-cdn.com/content/v1/600f517b90bae37dabc75605/1613824753043-UWH30HA336RLITCNQ0VM/DSC_0623.jpg",
    reverse: false,
  },
  {
    title: "The Story Behind Our Recipes",
    text: "Our recipes are inspired by generations of culinary tradition. Passed down through families, they bring authentic flavors to your kitchen.",
    image: "https://www.one-dragon-restaurant.com/wp-content/uploads/2024/03/The_Stories_Behind_Our_Traditional_Family_Recipes.webp",
    reverse: true,
  },
  {
    title: "Quality Ingredients for the Best Taste",
    text: "We believe that great food starts with great ingredients. That's why we prioritize fresh, organic, and locally sourced produce.",
    image: "https://www.happiesthealth.com/wp-content/uploads/2024/08/Should-you-eat-three-meals-a-day-Article.webp",
    reverse: false,
  },
  {
    title: "The Art of Cooking",
    text: "Cooking is more than just mixing ingredients—it's an art! Follow our step-by-step guides to master every dish with ease.",
    image: "https://waltonian.eastern.edu/wp-content/uploads/2021/11/cooking-vox.jpg",
    reverse: true,
  },
  {
    title: "Join Our Food Community",
    text: "We invite you to share your cooking experiences with us. Try our recipes, experiment, and bring your own twist to every dish!",
    image: "https://stratiscope.com/wp-content/uploads/2020/02/sharing-food-3184177-scaled-e1582504660188.jpg",
    reverse: false,
  },
];

const founder = [
    {
      title: "Nana Patekar",
      text: "He is the Founder of Toriko food Ingredients",
      image: "https://www.bollywoodhungama.com/wp-content/uploads/2017/02/Nana-Patekar-with-Lifetime.jpg",
      reverse: false,
    },
    {
      title: "Bhau Kadam",
      text: "He is the Co-Founder of Toriko food Ingredients",
      image: "https://images.news18.com/news18marathi/uploads/2024/11/bhau-kadam-2024-11-c2d7a679847e024bfda36453321fc321-3x2.jpg?im=FitAndFill=(1200,675)",
      reverse: true,
    },
    {
      title: "Tony stark",
      text: "Management team leader. ",
      image: "https://imageio.forbes.com/specials-images/imageserve/5d2392b234a5c400084abe23/Film-Robert-Downey-Jr/960x0.jpg?format=jpg&width=960",
      reverse: false,
    },
    {
      title: "natasha romanoff",
      text: "She is Adadvertiser. Help to reach our website to severy one through Advertisment",
      image: "https://filmschoolrejects.com/wp-content/uploads/2019/08/black-widow-700x480.jpg",
      reverse: true,
    },
    {
      title: "Akira toriyama (legend)",
      text: "Motivater for all workers and remaining team leaders as well as designer of the company",
      image: "https://laffaz.com/wp-content/uploads/2024/04/remembering-akira-toriyama-the-creator-of-dragon-ball-franchise.jpg",
      reverse: false,
    },
  ];

const AboutSection = ({ title, text, image, reverse }) => {
  return (
    <section className={`about-section ${reverse ? "bg-light" : ""} py-5` }>
      <div className="container">
        <div className="row align-items-center">
          <div className={`col-md-6 ${reverse ? "order-md-2" : ""}`}>
            <img src={image} className="img img-fluid rounded" alt={title} />
          </div>
          <div className={`col-md-6 ${reverse ? "order-md-1" : ""}`}>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <div>
      <h1 className="text-center mt-5">About Our Recipes</h1>
      {sections.map((section, index) => (
        <AboutSection key={index} {...section} />
      ))}

      <div className="container mt-5">
        <h2 className="text-center mb-4">Our Toriko Team</h2>
        <div className="row">
          {founder.map((card, index) => (
            <div key={index} className="col-md-4">
              <div className="animated-card">
                <img src={card.image} alt={card.title} className="card-img" />
                <div className="card-content">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
