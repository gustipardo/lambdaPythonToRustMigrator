SoRust# Rust on AWS Lambda?

Me and couple buddies are doing a project; the backend portion was written in Rust, which we intend to run as a lambda function on AWS. I'm completely new to Rust, as I was not the one who wrote the program for it in our group project, and was wondering how it worked when it comes to running it on AWS Lambda. I've been noticing people talking about how fast it is on the service, which makes it all the more desirable. A general structure that explains how to add AWS setup onto a Rust program with existing code would be very helpful. I've seen various videos which give me a general gist, but as a whole I'm unable to conceptualize the process. Any help would be very, very much appreciated! Thanks!

22·25

---

---
  

Check out the official AWS Lambda Rust project [https://github.com/awslabs/aws-lambda-rust-runtime](https://github.com/awslabs/aws-lambda-rust-runtime). It has a bunch of examples and we’ll designed. I got up and running knowing minimal Rust very quickly.

If you are developing a HTTP web app i recommend Axum and [https://crates.io/crates/axum-aws-lambda](https://crates.io/crates/axum-aws-lambda). It lets you run your app as a standard web app anywhere (good for local dev/testing) and also run using the aws-lambda-rust runtime with no code changes. The other advantage is you get a bunch of middleware available for free like CORS, compression etc.

Use clap for configuration, enable environment variables support as lambdas work well with config using env vars and my below recommendation of packaging as a Docker image. Locally you can run the app by passing in the correct flags, in lambda you pass in the env vars instead.

Package your lambda as a Docker image…compile and copy it in to a scratch base image with your binary set to the entrypoint. Using Docker means you can run the app anywhere (if use my suggestion of Axum aws lambda). It also makes the Lambda workflow really smooth. Push the Docker image to aws, click a drop down in aws lambda to select your image or if you use terraform to configure the lambda just tell it the name of the Docker image to use. No messing about uploading zip files or using the serverless project or similar.
I really like the Axum suggestion from a developer POV, but wondering does it add much to the runtime startup cost compared to a bared boned SDK configuration ?
I don’t have numbers but the Rust AWS lambda runtime uses http/hyper crates and Axum uses http/hyper so the integration is kind of an Adapter between the two, it’s not running an Axum server.

Without any network calls to third party services i.e. Dynamo using Axum integration to return some text I was getting sub millisecond responses on a 128mb instance. Any performance differences wasn’t noticeable.

Exactly what I've done with [vizdom.dev](https://vizdom.dev/) running completely in lambda leveraging Leptos + Axum with Opentelemetry for observability into Honeycomb. Very performant and cheap!

Docker image-based lambas also have MUCH faster cold starts ranging from 70-40% faster depending on the memory config. After about 1gb of ram, I saw no more than 40% faster cold starts, so I settled for 256mb as the sweet spot in terms of cost vs performance even though 128mb was more than enough ram (my max usage is ~80mb in my case due to in-memory caching).

1
Checkout the awsesome `cargo-lambda` crate for build/distribution/deployment.

  

Would recommend, they only thing it misses is a github action for me so its easier in cicd.
  
They do not have an official GitHub action, but they do have an official example of how to set one up. See the second last step: [https://www.cargo-lambda.info/guide/getting-started.html](https://www.cargo-lambda.info/guide/getting-started.html)

  
We wrote a blog post describing how we got started. Definitely recommend cargo-lambda. [https://blog.scanner.dev/getting-started-with-serverless-rust-in-aws-lambda/](https://blog.scanner.dev/getting-started-with-serverless-rust-in-aws-lambda/)

  
I tried an implementation similar to this. My Lambda tests ran fine but I always received an InternalServerError when I send a POST to the function.

  
Amazon has a very reasonable explanation from start to finish: [https://docs.aws.amazon.com/sdk-for-rust/latest/dg/lambda.html](https://docs.aws.amazon.com/sdk-for-rust/latest/dg/lambda.html)

Check out the lambda-web crate if your services use Axum, Actix or Rocket. Also highly recommend Cargo Lambda.

[https://mlopezgez.medium.com/serverless-lambda-function-with-rust-docker-and-terraform-548fb87fe85e](https://mlopezgez.medium.com/serverless-lambda-function-with-rust-docker-and-terraform-548fb87fe85e)

Hey friend, nice tutorial! I ended up using python for my project but if I ever need to use Rust on Lambda i’ll be sure to refer your blog post

  
Lambda Rust is now GA: [https://aws.amazon.com/about-aws/whats-new/2025/11/aws-lambda-rust/](https://aws.amazon.com/about-aws/whats-new/2025/11/aws-lambda-rust/)
\
Watch this video, I have a feeling it's exactly what you're looking for.

[https://youtu.be/EqV5wKD233c](https://youtu.be/EqV5wKD233c)

1

  

I couldn’t get it to work and the available documentation/examples are still quite sparse.

  

Check out the resources all of these guys are commenting here. It's been helping me out quite a bit
Unfortunately, most of them aren’t helpful and don’t cover the relevant implementation. Not only am I using a HTTP function, I am also using a Function URL—a new feature for AWS Lambda that the Rust crate claims to support, but haven’t seen a single working example yet.