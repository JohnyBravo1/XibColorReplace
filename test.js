function f1() {

    setTimeout(() => { return (10) }, 1000);
}

async function f2(x) {

  var y = await f1();
  console.log(y);
}

f2();