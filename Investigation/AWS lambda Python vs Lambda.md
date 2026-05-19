
# Post 1
## AWS Lambdas – Python vs Rust. Performance and Cost Savings.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-12-at-8.38.07-AM-1030x681.png)

Save money, save money!! Hear Hear! Someone on Linkedin recently brought up the point that companies could save gobs of money by swapping out AWS Python lambdas for [Rust ones](https://docs.aws.amazon.com/sdk-for-rust/latest/dg/lambda.html). While it raised the ire of many a Python Data Engineer, I thought it sounded like a great idea. At least it’s an excuse to play with Rust, and I will take all those I can get. It does seem like an easy and obvious step to take in [this age of cost-cutting](https://dataengineeringcentral.substack.com/p/reducing-cloud-costs-in-2023) that has come down on us all like that thick blanket of fog on a cool spring morning.

I can personally attest to the fact that I’ve written a number of Python [AWS lambdas](https://aws.amazon.com/lambda/) that are doing a non-trivial amount of data processing, currently running in Production and being triggered many times a day. Today, I’m going to reproduce both a Python and Rust lambda running on my personal AWS account doing pretty much the same exact work. Let’s see what the difference actually is in performance and see if it’s possible to find some cost savings.

## What’s a real-life Data Engineering use of AWS lambda?

Rather consume this content as a video? Check out the corresponding video on YouTube.

So what is the use case for our AWS lambda we would be building in both Python and Rust? It’s going to be processing `gzip` flat-files from `fixed-width` to `tab-delimited`, with `s3` as the source and `s3` as the destination. Say we daily receive the bain of many Data Engineers `fixed-width` compressed flat files and we want to covert them to a more standard `tab-delimited` versions so we can have a common file type prior to ingestion into some Data Lake.

An AWS lambda is the perfect tool for this right? Simply `trigger` when a file hits `s3`, kick off a `lambda`, covert the file to what we want, and deposit the result back into another `s3` location.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-12-at-12.05.56-PM-1030x556.png)

So to do this project, the first thing we are going to need is some flat files for testing, one fixed-width delimited and the other tab-delimited. We will use the [Backblaze hard drive free dataset,](https://www.backblaze.com/b2/hard-drive-test-data.html) taking one of those files and creating the two we need.

[All this code is available, including the test file, on GitHub](https://github.com/danielbeach/PythonVsRustAWSLambda). If you are not familiar with fix-width files, just Google it. The data points are all found between an index range, so there is no “delimiter” for these files. It makes them a big pain to deal with, especially if downstream systems like Spark are supposed to ingest them. Very annoying.

Here is a fixed-width delimited file I made from the above dataset.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-12-at-5.01.49-PM-1030x373.png)

Let’s start with a `0`index and define the fixed location of each column … as we will need this for both our Python and Rust lambda’s to parse the file.

start-end locations … (technically the location stops **_before_** the last number).

- **date** -> 0:15
- **serial_number** -> 15:36
- **model** -> 36:79
- **capacity_bytes** -> 79:98
- **failure** -> 98:109

## Python lambda.

So, lambdas. They are pretty easy to work with on AWS, if you use [the provided documentation](https://aws.amazon.com/lambda/getting-started/) you don’t really have much work to do besides swap out your code into the provided template(s).  At a high level pretty much every lambda you design, unless you change it, by default uses a function called `_**lambda_handler()**_` as the single entry point into the lambda. Aka that is what your lambda is going to call when it triggers.

Our AWS lambdas are going to be triggered when our `fixed-width` file hits `s3`. Our lambdas are going to receive a message into the `lambda_handler` function that is going to contain the unique `s3` remote uri of the file that just hit the bucket. That means both our Python and Rust lambdas are going probably to follow the same general workflow.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-26-at-3.03.14-PM-1030x154.png)

- get the s3 uri of the fixed-width file.
- download the file.
- convert fixed-width to tab-delimited.
- write the new file back out to `s3`.

Let’s get cracking. All code is [available on GitHub](https://github.com/danielbeach/PythonVsRustAWSLambda). You can use the `aws cli` to do all this, but for ease I just created the empty lambda’s via the UI.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-15-at-3.08.59-PM-1030x714.png)

Python lambda to convert a fixed-width to a tab-delimited file, trigger on the `s3` bucket to launch the lambda, and run the conversion. Don’t forget, [the code is available on GitHub](https://github.com/danielbeach/PythonVsRustAWSLambda).

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/carbon-808x1030.png)

Works like a charm to convert the fixed-width file. One thing to note is how simple and straightforward the code is, easy to reason about and debug. Sure, people on the internet say that Rust in the long term has no more cognitive and developer burden than any other language, but we all know that is crap.

Readability affects your codebase. Python’s readability is better than most, and that’s why people use it. So, when we drop the fixed-with gzipped file into our s3 bucket, does the lambda work? Of course.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-15-at-4.12.39-PM-1030x745.png)

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-15-at-4.13.50-PM-1030x406.png)

Here are some logs for AWS. Performance, aka runtime, and the amount of memory used.

*********UPDATE**********

_Due to numerous complaints here is the updated runtime for Python using LESS memory, 200MB max, instead of 350MB. This is closer to what was allocated to the Rust lambda. This of course made Python even slower._

**REPORT RequestId: 63aed740-42dc-49a1-92e8-e41349bcdfdd Duration: 15698.93 ms Billed Duration: 15699 ms Memory Size: 200 MB Max Memory Used: 140 MB Init Duration: 260.43 ms**

********UPDATE*************

~~_**REPORT RequestId: d8a7cae5-fb99-4e81-bc1a-fbb8a4fd646e Duration: 8361.76 ms Billed Duration: 8362 ms Memory Size: 350 MB Max Memory Used: 139 MB**_~~

Yikes, that’s about ~~_**8.362**_~~  _**15.69**_ seconds! Slow Slow! Sure Python might not be perfect, but that’s life. There are `230,000`records in this file, which are not very many. Most production files are much bigger. So you can imagine the runtimes on a few million records.

Let’s see what Rust can do.

## Rust lambda.

So, I’m going to be looking for a few things here. I think it’s obvious that Rust is going to be faster … that’s a given. But how much faster, also will the memory usage be reduced if we try to write the Rust in the same way? I also want to know how much code in Rust this is going to take. How complex it will be.

The reality is that humans are human, if the Rust code is overly burdensome to write, Data Engineerings just won’t do it, regardless of the cost savings. They will just use Python and move on with life.

It’s one thing to re-write Python over to Rust, but in the real world, you have to have developers troubleshoot, debug, and write that code. If it’s twice the amount of code, sure it’s cheaper to run because it’s faster … _**but it might not be cheaper to maintain over time!**_ Here are some [Rust docs for lambda](https://docs.aws.amazon.com/sdk-for-rust/latest/dg/lambda.html).

What I did was just copy the example lambda given in most of the AWS docs and ripped out the code, replacing it with mine.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-26-at-12.54.24-PM-1030x541.png)

Here is my ever-so-sad Rust code.  Here are some things of note, use `cargo-lambda` to create and build the binary `bootstrap.zip` that you will need to actually create our AWS Lambda. Something like _**cargo lambda build –release –output-format zip**_

I promise someday my Rust will get better.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/rusty.png)

So of course my Rust is verbose and has more lines of code than Python, but that’s pretty much to be expected. Especially when I am writing it, only a few months into Rust. Honestly, though, the Rust isn’t really that much more complicated, it’s just the static typing that makes it look more complicated.

What about speed?

**REPORT RequestId: ccf34808-00ae-47cb-81ef-3dc33d5a483e Duration: 6452.89 ms Billed Duration: 6491 ms Memory Size: 128 MB Max Memory Used: 85 MB Init Duration: 38.03 ms**

The Rust lambda is faster, clocking in around **6.452** seconds, vs Python’s _**~~8.362~~ 15.69,**_ and uses less memory with **85MB** vs Python’s **139MB**. All of which adds up to cost savings. I do have to say, I thought the Rust lambda would run much faster. I mean, there is a high probability that my Rust is probably written not so well.

Rust is ~~_ONLY_~~ **%60** percent faster on the runtime but uses **%40** less memory as well. Let’s be honest, that is me a terrible Rust programmer simply migrating Python code to Rust, not even really _trying_. If you are running a large number of lambdas doing similar work in production, of course, you are going to save a noticeable amount of money.

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-27-at-8.10.39-AM.png)

![](https://www.confessionsofadataguy.com/wp-content/uploads/2023/02/Screenshot-2023-02-27-at-8.12.05-AM.png)

February 26, 2023

##### Share this entry

- [](https://www.facebook.com/sharer.php?u=https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/&t=AWS%20Lambdas%20%E2%80%93%20Python%20vs%20Rust.%20Performance%20and%20Cost%20Savings.)
- [](https://twitter.com/share?text=AWS%20Lambdas%20%E2%80%93%20Python%20vs%20Rust.%20Performance%20and%20Cost%20Savings.&url=https://www.confessionsofadataguy.com/?p=11228)
- [](https://pinterest.com/pin/create/button/?url=https%3A%2F%2Fwww.confessionsofadataguy.com%2Faws-lambdas-python-vs-rust-performance-and-cost-savings%2F&description=AWS%20Lambdas%20%E2%80%93%20Python%20vs%20Rust.%20Performance%20and%20Cost%20Savings.&media=)
- [](https://linkedin.com/shareArticle?mini=true&title=AWS%20Lambdas%20%E2%80%93%20Python%20vs%20Rust.%20Performance%20and%20Cost%20Savings.&url=https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/)
- [](https://www.tumblr.com/share/link?url=https%3A%2F%2Fwww.confessionsofadataguy.com%2Faws-lambdas-python-vs-rust-performance-and-cost-savings%2F&name=AWS%20Lambdas%20%E2%80%93%20Python%20vs%20Rust.%20Performance%20and%20Cost%20Savings.&description=Save%20money%2C%20save%20money%21%21%20Hear%20Hear%21%20Someone%20on%20Linkedin%20recently%20brought%20up%20the%20point%20that%20companies%20could%20save%20gobs%20of%20money%20by%20swapping%20out%20AWS%20Python%20lambdas%20for%20Rust%20ones.%20While%20it%20raised%20the%20ire%20of%20many%20a%20Python%20Data%20Engineer%2C%20I%20thought%20it%20sounded%20like%20a%20great%20idea.%20At%20least%20it%E2%80%99s%20an%20excuse%20to%20%5B%E2%80%A6%5D)
- [](https://vk.com/share.php?url=https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/)
- [](https://reddit.com/submit?url=https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/&title=AWS%20Lambdas%20%E2%80%93%20Python%20vs%20Rust.%20Performance%20and%20Cost%20Savings.)
- [](mailto:?subject=AWS%20Lambdas%20%E2%80%93%20Python%20vs%20Rust.%20Performance%20and%20Cost%20Savings.&body=https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/)

22replies

1. ![Timophey](https://secure.gravatar.com/avatar/77b7983e238fd903c174ddb51475a473386b0220cf8292a5476d02ed06461169?s=60&d=mm&r=g)
    
    Timopheysays:
    
    [February 27, 2023 at 9:46 am](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-292)
    
    AFAIK AWS scale cpu fraction linear with memory.  
    So when you allocate 350 MB memory for python, and 128 MB for rust, you allocate for rust not only 3 times less memory, but 3 times less cpu.
    
    - ![Daniel](https://secure.gravatar.com/avatar/4bef7e0ea8b4c331829a6ee1b16aee9011bb8d52e300ee5c260455a57a589125?s=60&d=mm&r=g)
        
        Danielsays:
        
        [February 27, 2023 at 2:14 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-298)
        
        Jezz, nothing gets past you uh. I updated the code and the stats after re-running the test.
        
2. ![Jeffrey S Robbins](https://secure.gravatar.com/avatar/2bd1a2b021a5d37c9c5889700a1d66a1fd731bd6b144f620ebc2fce60ac0ab0e?s=60&d=mm&r=g)
    
    Jeffrey S Robbinssays:
    
    [February 27, 2023 at 12:54 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-293)
    
    Since Lambda allocates CPU via its memory configuration parameter (which is surprising, but true), a more fair test would run both languages with the same Lambda memory configuration.
    
    - ![Daniel](https://secure.gravatar.com/avatar/4bef7e0ea8b4c331829a6ee1b16aee9011bb8d52e300ee5c260455a57a589125?s=60&d=mm&r=g)
        
        Danielsays:
        
        [February 27, 2023 at 2:13 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-297)
        
        Good point, I did that and updated the specs. Rust is a lot faster now.
        
3. ![Anonymous](https://secure.gravatar.com/avatar/5f5c0b37980421878ad5784ca3cd4409d7701d32b5d9389d112526601209870e?s=60&d=mm&r=g)
    
    Anonymoussays:
    
    [February 27, 2023 at 1:22 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-294)
    
    That last graph (performance bat graph) is terrible in terms of units. You used the same y-axis scale while both things have different units. The proper way would be to have two y-axis scales, one on the left and one on the right. The units should be on the y-axis, not in the name of the dataset. Because you used the same scale for both columns that have numerically no relation to each other, the performance bar is very small while there is no good reason to be that way. I really liked the rest of this post keep up the good work 👍
    
    - ![Daniel](https://secure.gravatar.com/avatar/4bef7e0ea8b4c331829a6ee1b16aee9011bb8d52e300ee5c260455a57a589125?s=60&d=mm&r=g)
        
        Danielsays:
        
        [February 27, 2023 at 2:13 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-296)
        
        I updated the chart, now there are two. waala.
        
4. ![Andreas](https://secure.gravatar.com/avatar/c7eb3ddccf1e8fcfb54b6bab633b9bf23afc63820a78ed90f5356534c840e64f?s=60&d=mm&r=g)
    
    Andreassays:
    
    [February 27, 2023 at 1:28 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-295)
    
    Is there any specific reason why you initialise the S3 client before the loop in python, and inside the loop for the rust version?  
    Looking at the code I would lean towards thinking that that is about 30-50% of the overall cost.
    
    Also not sure why you hit the disk so many times if all of this could be done streaming?
    
    - ![Daniel](https://secure.gravatar.com/avatar/4bef7e0ea8b4c331829a6ee1b16aee9011bb8d52e300ee5c260455a57a589125?s=60&d=mm&r=g)
        
        Danielsays:
        
        [February 27, 2023 at 2:14 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-299)
        
        Just because.
        
        - ![Rob N Jellinghaus](https://secure.gravatar.com/avatar/8e9fa5d5388de4f0b4dbf8270e126d7969ff8948e85bbd8ff435588921556a64?s=60&d=mm&r=g)
            
            [Rob N Jellinghaus](https://robjsoftware.info/)says:
            
            [February 28, 2023 at 7:34 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-307)
            
            You seriously need to try this change though. My guess is it could give you another 5x to 10x Rust performance.
            
5. ![anonymous](https://secure.gravatar.com/avatar/a8c4271ffca17a5708183b3b9507f7e1e386ba08108353a556d1e1c91c68ed6f?s=60&d=mm&r=g)
    
    anonymoussays:
    
    [February 27, 2023 at 5:24 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-300)
    
    nice catch!
    
6. ![Carl](https://secure.gravatar.com/avatar/b78c142602ca2b6369e535477f6dbff3d764f59947f899c5b6adabd7e20faae1?s=60&d=mm&r=g)
    
    Carlsays:
    
    [February 27, 2023 at 6:17 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-301)
    
    I would like to have seen this colored up a bit more. The article just kind of ends with the only conclusion being “If you are running a large number of lambdas doing similar work in production, of course, you are going to save a noticeable amount of money.” There is quite a bit of nuance that seems to be missing. For instance, the AWS Lambda free tier is 400,000 GB-seconds per month. At 200MB max memory, you’d get 2,000,000 free seconds. If each Lambda took 16 seconds, you could run it 125,000 times before you started having to pay for it. Since the test file was 25MiB expanded, that means over 3,000 GiB of data could be processed for free. For some applications, that volume of data in a month would be unrealistic.  
    I’d like to see a more concrete real-world example where the bottom line was something like “converting this Lambda from Python to Rust saved $X.”
    
    - ![Daniel](https://secure.gravatar.com/avatar/4bef7e0ea8b4c331829a6ee1b16aee9011bb8d52e300ee5c260455a57a589125?s=60&d=mm&r=g)
        
        Danielsays:
        
        [February 27, 2023 at 8:31 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-302)
        
        Dude. Don’t rain on my parade.
        
7. ![Miau](https://secure.gravatar.com/avatar/47222639b3867013b5213d0a217e348cce80a7ffb7b70836f13b444d15400840?s=60&d=mm&r=g)
    
    Miausays:
    
    [February 27, 2023 at 10:49 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-303)
    
    The rust you’ve written has perf wins everywhere, for example, the events aren’t parallelized and you’re rebuilding the client in each iteration. It’s a multi-threaded language, make use of it.
    
    - ![Daniel](https://secure.gravatar.com/avatar/4bef7e0ea8b4c331829a6ee1b16aee9011bb8d52e300ee5c260455a57a589125?s=60&d=mm&r=g)
        
        Danielsays:
        
        [February 28, 2023 at 1:39 am](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-305)
        
        Dude, it was for a blog, not real life. Besides it was like the 10th time I’ve written Rust in my life. Jeez.
        
8. ![Gerald Lester](https://secure.gravatar.com/avatar/8476578f34c0314988b80a5d154c816253d8b54d13280a2b5479d989eb1aca76?s=60&d=mm&r=g)
    
    Gerald Lestersays:
    
    [February 27, 2023 at 11:22 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-304)
    
    How did the cold start times compare?
    
    - ![Sirajul](https://secure.gravatar.com/avatar/d40e655ddd4f957f969a1654e1bfb580c54e5076ff01a263a8b6d047ace58257?s=60&d=mm&r=g)
        
        Sirajulsays:
        
        [February 28, 2023 at 8:10 am](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-306)
        
        You can,see that fron the Init Duration. Rust already wins!
        
9. ![Aaron](https://secure.gravatar.com/avatar/04758fd227cff79b683ab900d89adad5187ff06c3991ae6d51b0a87fcc796299?s=60&d=mm&r=g)
    
    Aaronsays:
    
    [February 28, 2023 at 8:31 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-308)
    
    Hey, thanks for this! I’m new to both AWS and Rust, despite being in data-related positions for decades. Don’t mind the folks being curt with their feedback. I found the post helpful and informative, even if your Rust, like mine, is a little…rusty.
    
10. ![Pavel](https://secure.gravatar.com/avatar/ad2fa95ef2a1fc5c065977c79616863f1f98b60bb93054948e876a2b36bb7b7f?s=60&d=mm&r=g)
    
    Pavelsays:
    
    [February 28, 2023 at 8:43 pm](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-309)
    
    Hi Daniel, i really enjoyed your article. I wonder if you could optimize your Python using iterator instead of list.
    
    Glancing over your GitHub code, I noticed that after unpacking your file you read it into into list. I would try yield instead.
    
11. ![Robert Collins](https://secure.gravatar.com/avatar/6ac52c9fd79a0ddb30de0d7365d5ff332983e36c68ac5dd702b17d0e2958febc?s=60&d=mm&r=g)
    
    [Robert Collins](http://rbtcollins.wordpress.com/)says:
    
    [March 1, 2023 at 12:48 am](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-310)
    
    Thank you for the interesting puzzle. I’ve been meaning to do rust-on-lambda for a while, and your code (provocatively I suspect, since the AWS rust docs you linked too had somewhat better setup) was just the bump I needed.
    
    I note a few things: Python defaults to compression level 9. Rust’s GzEncoder defaults to 6. Thats 3 seconds on your dataset.
    
    Secondly, the cargo-lambda lambda actual setup was rough. I spent way too long tracking down missing logging configurations after creating a new lambda by accident. Nothing to do with Rust per se of course.
    
    With getting particularly exotic, I got the code down to 4.4 seconds (cold) with 35MB of RAM. It is on RAM usage that people tend to see significantly better behaviour from Rust in serialized algorithms.
    
    REPORT RequestId: 318669fb-9427-49af-b843-ad9015f39c68 Duration: 46.59 ms Billed Duration: 47 ms Memory Size: 200 MB Max Memory Used: 35 MB
    
    That said, here are my notes; the code is at [https://github.com/rbtcollins/PythonVsRustAWSLambda/tree/tweaks](https://github.com/rbtcollins/PythonVsRustAWSLambda/tree/tweaks)
    
    1) move main.rs to src/main.rs
    
    allows rust analyzer in vscode to work without fiddling. If you haven’t used this, try it!
    
    2) fix lints (cargo clippy will show, so will rust-analyzer)
    
    warning: use of deprecated function `lambda_runtime::handler_fn`: Use `service_fn` and `LambdaEvent` instead
    
    –> src/main.rs:1:22
    
    right click on handler_fn; select ‘go to definition’, copy the content.
    
    insert into main, look at it a little and then replace f with handler, and A with Value.
    
    Cleanup the old code.
    
    3) run cargo fmt. Rust has its own formatting tool, just go with it.
    
    4) lift the s3 client outside the handler – it only depends on the env variables.
    
    Move the config and client construction lines to main. Add a parameter to the
    
    handler to accept the s3 client. Change the closure to pass in the client.
    
    Because its a move closure, this takes ownership of the s3 client. To permit
    
    lambda to call it many times, it must pass it into the handler; I chose to pass
    
    a clone in as that is idiomatic with these API clients.
    
    5) removed explicit types
    
    Except at function boundaries and for functions like ‘collect’ that can return
    
    many different types, Rust usually infers types very well.
    
    6) Replaced the generic json Value with S3Event: I suspected the framework would
    
    permit this as otherwise why would it permit a type parameter on the
    
    LambdaEvent struct. This was the first risky thing, so I took the time after
    
    this to build and test it in lambda.
    
    made a new lambda, custom runtime, a2
    
    wired up s3
    
    cargo lambda build –release –arm64
    
    cargo lambda deploy –iam-role …
    
    which made a new lambda, then s3 configuration failed.
    
    -> deleted the old lambda, retried
    
    This then failed at
    
    “`
    
    START RequestId: 3781796c-9179-463a-951b-f2fe5389d93d Version: $LATEST
    
    thread ‘main’ panicked at ‘byte index 78 is out of bounds of `2022-10-01 PL2331LAGLW5UJ HGST HMS5C4040BLE640 4000787030016 0`’, src/main.rs:57:26
    
    END RequestId: 3781796c-9179-463a-951b-f2fe5389d93d
    
    REPORT RequestId: 3781796c-9179-463a-951b-f2fe5389d93d Duration: 650.13 ms Billed Duration: 651 ms Memory Size: 128 MB Max Memory Used: 83 MB
    
    “`
    
    which shows it at least read the event and started processing, so we could move on.
    
    7) converted expects to anyhow contexts; added anyhow as a dep and sorted imports
    
    noticed that the code hardcodes the output folder, so added the folders to my test bucket.
    
    At this point my lamdba started working properly.
    
    Next up: give it speed.
    
    8) stream the bucket into gz decoding. I hadn’t actually done that before, but the principle is pretty clear:
    
    I want to read from the GZDecoder. So it needs to accept an impl Read that is backed by the bucket retrieval, and tokio has all the primitives to let us write this very simply.
    
    This dropped time from ~7 to ~4.5 seconds (including startup).
    
    9) move all the blocking computation logic up into the blocking section,
    
    and remove temporary variables: process the iterator directly into the output string.
    
    very little impact – but none was expected
    
    10) gz compress to a vector in memory. Also change its compression level to match Python’s default of 9.
    
    11) minor code golf
    
    - ![Robert Collins](https://secure.gravatar.com/avatar/6ac52c9fd79a0ddb30de0d7365d5ff332983e36c68ac5dd702b17d0e2958febc?s=60&d=mm&r=g)
        
        [Robert Collins](http://rbtcollins.wordpress.com/)says:
        
        [March 1, 2023 at 12:50 am](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-311)
        
        Forgot to mention: that time is on ARM
        
    - ![Weidox](https://secure.gravatar.com/avatar/b9ec69bdc9760c22d1050a2d1ecc6a9cb1c532745fdb2d1bd187c902c3fd924c?s=60&d=mm&r=g)
        
        Weidoxsays:
        
        [March 1, 2023 at 6:11 am](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-312)
        
        If it is 4.4s with 35mb of ram, how long it takes with 200mb? People are writing here that cpu allocation is proportional to ram.
        
12. ![weidox](https://secure.gravatar.com/avatar/b9ec69bdc9760c22d1050a2d1ecc6a9cb1c532745fdb2d1bd187c902c3fd924c?s=60&d=mm&r=g)
    
    weidoxsays:
    
    [March 1, 2023 at 6:16 am](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/#comment-313)
    
    Without detailed optimizations, would be nice to see how original code works with fixing two main issues – s3 client initialization in loop (hurts Rust) and different compression level (hurts Python).
    

### Comments are closed.

## MOST POPULAR

- [Replacing Pandas with Polars. A Practical Guide.](https://www.confessionsofadataguy.com/replacing-pandas-with-polars-a-practical-guide/)57.6k views
- [What I’ve Learned After A Decade Of Data Engineering](https://www.confessionsofadataguy.com/what-ive-learned-after-a-decade-of-data-engineering/)32.1k views
- [Introduction to Unit Testing with PySpark.](https://www.confessionsofadataguy.com/introduction-to-unit-testing-with-pyspark/)28.9k views
- [Httpx vs Requests in Python. Performance and other Musings.](https://www.confessionsofadataguy.com/httpx-vs-requests-in-python-performance-and-other-musings/)27.6k views
- [AWS Lambdas – Python vs Rust. Performance and Cost Savings.](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/)22.2k views

### Categories

- [AI](https://www.confessionsofadataguy.com/category/ai/)
- [Big Data](https://www.confessionsofadataguy.com/category/big-data/)
- [Data](https://www.confessionsofadataguy.com/category/data/)
- [Data Engineering](https://www.confessionsofadataguy.com/category/data-engineering/)
- [Data Quality](https://www.confessionsofadataguy.com/category/data-quality/)
- [Data Warehousing](https://www.confessionsofadataguy.com/category/data-warehousing/)
- [DuckDB](https://www.confessionsofadataguy.com/category/duckdb/)
- [Geospatial](https://www.confessionsofadataguy.com/category/geospatial/)
- [Golang](https://www.confessionsofadataguy.com/category/golang/)
- [Machine Learning](https://www.confessionsofadataguy.com/category/machine-learning/)
- [Python](https://www.confessionsofadataguy.com/category/python/)
- [Ramblings](https://www.confessionsofadataguy.com/category/ramblings/)
- [Rust](https://www.confessionsofadataguy.com/category/rust/)
- [Scala](https://www.confessionsofadataguy.com/category/scala/)
- [SQL](https://www.confessionsofadataguy.com/category/sql/)
- [Uncategorized](https://www.confessionsofadataguy.com/category/uncategorized/)

### Archives

  Select Month   May 2026    April 2026    March 2026    February 2026    January 2026    December 2025    November 2025    October 2025    September 2025    August 2025    July 2025    June 2025    May 2025    April 2025    March 2025    February 2025    January 2025    December 2024    November 2024    October 2024    September 2024    August 2024    July 2024    June 2024    May 2024    April 2024    March 2024    February 2024    January 2024    December 2023    November 2023    October 2023    September 2023    August 2023    July 2023    June 2023    May 2023    April 2023    March 2023    February 2023    January 2023    December 2022    November 2022    October 2022    September 2022    August 2022    July 2022    June 2022    May 2022    April 2022    March 2022    February 2022    January 2022    December 2021    November 2021    October 2021    September 2021    August 2021    July 2021    June 2021    May 2021    April 2021    March 2021    February 2021    January 2021    December 2020    November 2020    October 2020    September 2020    August 2020    July 2020    June 2020    May 2020    April 2020    March 2020    January 2020    December 2019    November 2019    October 2019    September 2019    August 2019    July 2019    May 2019    March 2019    February 2019    January 2019    December 2018    November 2018    October 2018    September 2018    July 2018    June 2018    May 2018    April 2018    March 2018    February 2018  

### Interesting links

Here are some interesting links for you! Enjoy your stay :)

### Pages

- [About](https://www.confessionsofadataguy.com/about/)
- [Contact](https://www.confessionsofadataguy.com/contact/)
- [Data Engineering Consulting and Contracting](https://www.confessionsofadataguy.com/data-engineering-consulting-and-contracting/)
- [Deterministic Agentic Systems: The Part Nobody Talks About](https://www.confessionsofadataguy.com/deterministic-agentic-systems-the-part-nobody-talks-about/)
- [Home](https://www.confessionsofadataguy.com/)
- [Resources](https://www.confessionsofadataguy.com/resources/)

### Categories

- [AI](https://www.confessionsofadataguy.com/category/ai/)
- [Big Data](https://www.confessionsofadataguy.com/category/big-data/)
- [Data](https://www.confessionsofadataguy.com/category/data/)
- [Data Engineering](https://www.confessionsofadataguy.com/category/data-engineering/)
- [Data Quality](https://www.confessionsofadataguy.com/category/data-quality/)
- [Data Warehousing](https://www.confessionsofadataguy.com/category/data-warehousing/)
- [DuckDB](https://www.confessionsofadataguy.com/category/duckdb/)
- [Geospatial](https://www.confessionsofadataguy.com/category/geospatial/)
- [Golang](https://www.confessionsofadataguy.com/category/golang/)
- [Machine Learning](https://www.confessionsofadataguy.com/category/machine-learning/)
- [Python](https://www.confessionsofadataguy.com/category/python/)
- [Ramblings](https://www.confessionsofadataguy.com/category/ramblings/)
- [Rust](https://www.confessionsofadataguy.com/category/rust/)
- [Scala](https://www.confessionsofadataguy.com/category/scala/)
- [SQL](https://www.confessionsofadataguy.com/category/sql/)
- [Uncategorized](https://www.confessionsofadataguy.com/category/uncategorized/)

### Archive

- [May 2026](https://www.confessionsofadataguy.com/2026/05/)
- [April 2026](https://www.confessionsofadataguy.com/2026/04/)
- [March 2026](https://www.confessionsofadataguy.com/2026/03/)
- [February 2026](https://www.confessionsofadataguy.com/2026/02/)
- [January 2026](https://www.confessionsofadataguy.com/2026/01/)
- [December 2025](https://www.confessionsofadataguy.com/2025/12/)
- [November 2025](https://www.confessionsofadataguy.com/2025/11/)
- [October 2025](https://www.confessionsofadataguy.com/2025/10/)
- [September 2025](https://www.confessionsofadataguy.com/2025/09/)
- [August 2025](https://www.confessionsofadataguy.com/2025/08/)
- [July 2025](https://www.confessionsofadataguy.com/2025/07/)
- [June 2025](https://www.confessionsofadataguy.com/2025/06/)
- [May 2025](https://www.confessionsofadataguy.com/2025/05/)
- [April 2025](https://www.confessionsofadataguy.com/2025/04/)
- [March 2025](https://www.confessionsofadataguy.com/2025/03/)
- [February 2025](https://www.confessionsofadataguy.com/2025/02/)
- [January 2025](https://www.confessionsofadataguy.com/2025/01/)
- [December 2024](https://www.confessionsofadataguy.com/2024/12/)
- [November 2024](https://www.confessionsofadataguy.com/2024/11/)
- [October 2024](https://www.confessionsofadataguy.com/2024/10/)
- [September 2024](https://www.confessionsofadataguy.com/2024/09/)
- [August 2024](https://www.confessionsofadataguy.com/2024/08/)
- [July 2024](https://www.confessionsofadataguy.com/2024/07/)
- [June 2024](https://www.confessionsofadataguy.com/2024/06/)
- [May 2024](https://www.confessionsofadataguy.com/2024/05/)
- [April 2024](https://www.confessionsofadataguy.com/2024/04/)
- [March 2024](https://www.confessionsofadataguy.com/2024/03/)
- [February 2024](https://www.confessionsofadataguy.com/2024/02/)
- [January 2024](https://www.confessionsofadataguy.com/2024/01/)
- [December 2023](https://www.confessionsofadataguy.com/2023/12/)
- [November 2023](https://www.confessionsofadataguy.com/2023/11/)
- [October 2023](https://www.confessionsofadataguy.com/2023/10/)
- [September 2023](https://www.confessionsofadataguy.com/2023/09/)
- [August 2023](https://www.confessionsofadataguy.com/2023/08/)
- [July 2023](https://www.confessionsofadataguy.com/2023/07/)
- [June 2023](https://www.confessionsofadataguy.com/2023/06/)
- [May 2023](https://www.confessionsofadataguy.com/2023/05/)
- [April 2023](https://www.confessionsofadataguy.com/2023/04/)
- [March 2023](https://www.confessionsofadataguy.com/2023/03/)
- [February 2023](https://www.confessionsofadataguy.com/2023/02/)
- [January 2023](https://www.confessionsofadataguy.com/2023/01/)
- [December 2022](https://www.confessionsofadataguy.com/2022/12/)
- [November 2022](https://www.confessionsofadataguy.com/2022/11/)
- [October 2022](https://www.confessionsofadataguy.com/2022/10/)
- [September 2022](https://www.confessionsofadataguy.com/2022/09/)
- [August 2022](https://www.confessionsofadataguy.com/2022/08/)
- [July 2022](https://www.confessionsofadataguy.com/2022/07/)
- [June 2022](https://www.confessionsofadataguy.com/2022/06/)
- [May 2022](https://www.confessionsofadataguy.com/2022/05/)
- [April 2022](https://www.confessionsofadataguy.com/2022/04/)
- [March 2022](https://www.confessionsofadataguy.com/2022/03/)
- [February 2022](https://www.confessionsofadataguy.com/2022/02/)
- [January 2022](https://www.confessionsofadataguy.com/2022/01/)
- [December 2021](https://www.confessionsofadataguy.com/2021/12/)
- [November 2021](https://www.confessionsofadataguy.com/2021/11/)
- [October 2021](https://www.confessionsofadataguy.com/2021/10/)
- [September 2021](https://www.confessionsofadataguy.com/2021/09/)
- [August 2021](https://www.confessionsofadataguy.com/2021/08/)
- [July 2021](https://www.confessionsofadataguy.com/2021/07/)
- [June 2021](https://www.confessionsofadataguy.com/2021/06/)
- [May 2021](https://www.confessionsofadataguy.com/2021/05/)
- [April 2021](https://www.confessionsofadataguy.com/2021/04/)
- [March 2021](https://www.confessionsofadataguy.com/2021/03/)
- [February 2021](https://www.confessionsofadataguy.com/2021/02/)
- [January 2021](https://www.confessionsofadataguy.com/2021/01/)
- [December 2020](https://www.confessionsofadataguy.com/2020/12/)
- [November 2020](https://www.confessionsofadataguy.com/2020/11/)
- [October 2020](https://www.confessionsofadataguy.com/2020/10/)
- [September 2020](https://www.confessionsofadataguy.com/2020/09/)
- [August 2020](https://www.confessionsofadataguy.com/2020/08/)
- [July 2020](https://www.confessionsofadataguy.com/2020/07/)
- [June 2020](https://www.confessionsofadataguy.com/2020/06/)
- [May 2020](https://www.confessionsofadataguy.com/2020/05/)
- [April 2020](https://www.confessionsofadataguy.com/2020/04/)
- [March 2020](https://www.confessionsofadataguy.com/2020/03/)
- [January 2020](https://www.confessionsofadataguy.com/2020/01/)
- [December 2019](https://www.confessionsofadataguy.com/2019/12/)
- [November 2019](https://www.confessionsofadataguy.com/2019/11/)
- [October 2019](https://www.confessionsofadataguy.com/2019/10/)
- [September 2019](https://www.confessionsofadataguy.com/2019/09/)
- [August 2019](https://www.confessionsofadataguy.com/2019/08/)
- [July 2019](https://www.confessionsofadataguy.com/2019/07/)
- [May 2019](https://www.confessionsofadataguy.com/2019/05/)
- [March 2019](https://www.confessionsofadataguy.com/2019/03/)
- [February 2019](https://www.confessionsofadataguy.com/2019/02/)
- [January 2019](https://www.confessionsofadataguy.com/2019/01/)
- [December 2018](https://www.confessionsofadataguy.com/2018/12/)
- [November 2018](https://www.confessionsofadataguy.com/2018/11/)
- [October 2018](https://www.confessionsofadataguy.com/2018/10/)
- [September 2018](https://www.confessionsofadataguy.com/2018/09/)
- [July 2018](https://www.confessionsofadataguy.com/2018/07/)
- [June 2018](https://www.confessionsofadataguy.com/2018/06/)
- [May 2018](https://www.confessionsofadataguy.com/2018/05/)
- [April 2018](https://www.confessionsofadataguy.com/2018/04/)
- [March 2018](https://www.confessionsofadataguy.com/2018/03/)
- [February 2018](https://www.confessionsofadataguy.com/2018/02/)

© Copyright - [Confessions of a Data Guy](https://www.confessionsofadataguy.com/) - [Enfold WordPress Theme by Kriesi](https://kriesi.at/)

[Data Types in Delta Lake + Spark. Join and Storage Performance.](https://www.confessionsofadataguy.com/data-types-in-delta-lake-spark-join-performance-and-thoughts/)[GitHub’s CoPilot Writes Data Pipelines](https://www.confessionsofadataguy.com/githubs-copilot-writes-data-pipelines/)


# Post 2:
[Blog | Pragmatic AI Labs](https://paiml.com/blog)

- [DS500](https://ds500.paiml.com/)
- [Pragmatic AI Labs](https://paiml.com/)

## lambda-rust-python

2024-12-30

## Benchmarking AWS Lambda: Python vs. Rust for Data Engineering Workloads

In this blog post, we’ll explore how to benchmark and compare the performance of **Python** and **Rust** Lambda functions on AWS. We’ll focus on a computationally intensive task—calculating the Fibonacci sequence recursively—and analyze the results to understand the impact of language choice, memory allocation, and optimization. Additionally, we’ll estimate costs for hypothetical Fortune 500 data engineering workloads to highlight the potential cost savings of using Rust over Python.

![Rust vs Python Lambda](https://paiml.com/blog/images/lambda-rust.png)

---

## **Introduction**

AWS Lambda is a popular serverless computing service that allows you to run code without managing servers. However, the choice of programming language and optimization techniques can significantly impact performance and cost. In this post, we’ll:

1. Deploy Python and Rust Lambda functions.
2. Benchmark their performance for a computationally intensive task.
3. Analyze the results and estimate costs for large-scale workloads.

---

## **Setup**

### **Prerequisites**

Before diving in, ensure you have the following installed:

- **AWS CLI**: Configured with credentials.
- **Python**: For local testing and development.
- **Rust**: For local testing and development.
- **jq**: For JSON parsing in Bash scripts.

### **Installation**

1. Clone the repository:
    
    ```bash
    git clone https://codeberg.org/noahgift/AWS-Gen-AI.git
    cd AWS-Gen-AI/python-vs-rust/rust-benchmark
    ```
    
2. Make the scripts executable:
    
    ```bash
    chmod +x benchmark.sh update-memory.sh
    ```
    

---

## **Lambda Functions**

### **Python Lambda Function**

The Python Lambda function calculates the Fibonacci sequence recursively. Here’s the code:

```python
from time import perf_counter
import json

def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def handler(event, context):
    start = perf_counter()
    result = fibonacci(event.get('n', 40))
    return {'statusCode': 200, 'body': json.dumps({
        'result': result,
        'duration_ms': (perf_counter() - start) * 1000
    })}
```

### **Rust Lambda Function**

The Rust Lambda function also calculates the Fibonacci sequence recursively. Here’s the code:

```rust
use lambda_runtime::{handler_fn, Context, Error};
use serde_json::{json, Value};

fn fibonacci(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    fibonacci(n - 1) + fibonacci(n - 2)
}

async fn handler(event: Value, _: Context) -> Result<Value, Error> {
    let n = event["n"].as_u64().unwrap_or(40) as u32;
    let start = std::time::Instant::now();
    let result = fibonacci(n);
    let duration_ms = start.elapsed().as_millis();
    Ok(json!({
        "statusCode": 200,
        "body": {
            "result": result,
            "duration_ms": duration_ms
        }
    }))
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    lambda_runtime::run(handler_fn(handler)).await?;
    Ok(())
}
```

---

## **Benchmarking**

### **Benchmark Script**

The `benchmark.sh` script automates the process of benchmarking the Lambda functions. It:

1. Validates the Lambda configurations.
2. Invokes each function multiple times (default: 10 iterations).
3. Measures and averages the execution times.

#### **Usage**

```bash
./benchmark.sh [--payload <payload>] [--iterations <iterations>]
```

#### **Examples**

- Default payload (`{"n": 40}`) and 10 iterations:
    
    ```bash
    ./benchmark.sh
    ```
    
- Custom payload (`{"n": 28}`) and 5 iterations:
    
    ```bash
    ./benchmark.sh --payload '{"n": 28}' --iterations 5
    ```
    

### **Memory Configuration**

The `update-memory.sh` script updates the memory allocation for both Lambda functions. It defaults to **3,000 MB** but allows for custom memory sizes.

#### **Usage**

```bash
./update-memory.sh [--memory <memory>]
```

#### **Examples**

- Default memory (3,000 MB):
    
    ```bash
    ./update-memory.sh
    ```
    
- Custom memory (1,792 MB):
    
    ```bash
    ./update-memory.sh --memory 1792
    ```
    

---

## **Results**

### **Sample Output**

```bash
Validating Lambda configurations...
Validation for FibonacciFunction:
  Architecture: arm64
  Memory Size: 3000 MB
  Runtime: python3.9
  Timeout: 10 seconds

Validation for rust-benchmark:
  Architecture: arm64
  Memory Size: 3000 MB
  Runtime: provided.al2023
  Timeout: 10 seconds

Benchmarking Python Lambda function...
Invocation 1: 10449 ms
Invocation 2: 10459 ms
Invocation 3: 10466 ms
Average execution time for FibonacciFunction: 10458 ms

Benchmarking Rust Lambda function...
Invocation 1: 864 ms
Invocation 2: 849 ms
Invocation 3: 845 ms
Average execution time for rust-benchmark: 852 ms
```

### **Key Observations**

- **Python**: Significantly slower due to its interpreted nature and the inefficiency of the recursive Fibonacci algorithm.
- **Rust**: Much faster due to its compiled nature and lower-level optimizations.
- **Memory Impact**: Increasing memory allocation improves performance by providing more CPU power.

---

## **Cost Analysis**

### **Hypothetical Fortune 500 Workload**

#### **Assumptions**

- **Daily Invocations**: 100 million invocations per day.
- **Monthly Invocations**: 3 billion invocations per month (30 days).
- **Execution Time**:
    - **Python**: 10 seconds per invocation.
    - **Rust**: 1 second per invocation.
- **Memory Allocation**: 3,000 MB (3 GB).

#### **Cost Calculation**

1. **Number of Requests**:
    
    ```
    Cost = (3,000,000,000 / 1,000,000) × $0.20 = $600
    ```
    
2. **Execution Time**:
    - **Python**: 90 billion GB-seconds → $1,500,300
    - **Rust**: 9 billion GB-seconds → $150,030
3. **Total Cost**:
    - **Python**: $1,500,900 per month
    - **Rust**: $150,630 per month

#### **Cost Savings**

```
Savings = $1,500,900 - $150,630 = $1,350,270 per month
```

---

## **Optimization**

### **Python**

- Use **memoization** to reduce the time complexity of the Fibonacci algorithm:
    
    ```python
    from functools import lru_cache
    
    @lru_cache(maxsize=None)
    def fibonacci(n: int) -> int:
        if n <= 1:
            return n
        return fibonacci(n - 1) + fibonacci(n - 2)
    ```
    

### **Rust**

- Use an **iterative approach** to calculate Fibonacci:
    
    ```rust
    fn fibonacci(n: u32) -> u64 {
        let mut a = 0;
        let mut b = 1;
        for _ in 0..n {
            let temp = a;
            a = b;
            b = temp + b;
        }
        a
    }
    ```
    

---

## **Best Practices**

1. **Optimize Algorithms**: Use efficient algorithms to reduce execution time.
2. **Adjust Memory**: Increase memory allocation to improve CPU power.
3. **Use Provisioned Concurrency**: Reduce cold start latency for performance-critical applications.
4. **Monitor Logs**: Use CloudWatch logs to debug and optimize Lambda functions.

---

## **Conclusion**

This project demonstrates how to benchmark and compare the performance of Python and Rust Lambda functions on AWS. By adjusting memory allocation and optimizing the Fibonacci algorithm, you can achieve significant performance improvements. The provided scripts automate the process, making it easy to test and analyze different configurations.

For **Fortune 500 data engineering workloads**, switching from Python to Rust can result in **significant cost savings** (up to 90% in this example). By optimizing algorithms, memory allocation, and invocation patterns, organizations can further reduce costs and improve performance.

---

## **License**

This project is licensed under the MIT License. See the [LICENSE](https://paiml.com/blog/2024-12-30-lambda-rust-python/LICENSE) file for details.

---

**Tags**: AWS Lambda, Python, Rust, Benchmarking, Cost Analysis, Data Engineering

**Repository**: [AWS-Gen-AI/python-vs-rust/rust-benchmark](https://codeberg.org/noahgift/AWS-Gen-AI/src/branch/main/python-vs-rust/rust-benchmark)

---

Want expert ML/AI training? Visit [paiml.com](https://paiml.com/)

For hands-on courses: [DS500 Platform](https://ds500.paiml.com/)