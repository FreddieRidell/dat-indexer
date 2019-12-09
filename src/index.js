import { start, dispatch, stop, spawnStateless } from "nact";
import { DatArchive } from "dat-sdk/auto";

import crawler from "./actors/crawler";
import { foundLinks } from "./messages";

const system = start();

const crawlerInstance = crawler.create(system);

const sinks = [
	"dat://145325df2c45dde316096cf984f5aa6119e3207982a704d38aab52ed11aa87db",
	"dat://25cbfb9bcbc085f4e11a13dfea56719294a05d2769ce97451106937bbc589ebc",
	"dat://26232fd9e3b7683cabe91fff04ca43cf65c59ce888be89d3635fea9d3a02a6f2",
	"dat://32d225818f3928d4f17ed4893108f630d59023ccbbda196262ecd936e4033421",
	"dat://48e5c4fd54c35390a2f4ef9afde4dddd494b5a2c9f7f83ae9c5f6c200ce7277a",
	"dat://4bcecf2846c1a60320db246ec2d84acded2806cc566c4cebcdeb87ff4d9336f6",
	"dat://527f404aa77756b91cba4e3ba9fe30f72ee3eb5eef0f4da87172745f9389d1e5",
	"dat://65b6b10cd0b2d83d4c2a049cb1624989aaee06dd710c3d7b0c63c113febaccef",
	"dat://6972ffe4bb8d24c63c92b91ef3aebf400c4899db8d5020adb96d9c8d46d7609c",
	"dat://87ed2e3b160f261a032af03921a3bd09227d0a4cde73466c17114816cae43336",
	"dat://88c835ba8b03a71eb5f27843331e28f2004884347412a1956a339355a6affb29",
	"dat://91a8cd6faa0e2398f5df87d29b31dce68825454b9f83978a839a00473757aaed",
	"dat://a43f15b8c80a191ed7166034f8b91c766d0e594a6fd668c27e86d79d26f96c59",
	"dat://ab1511fe4afc043c751e8ce11a38878cc90fc6ece8f9fdde66c996fbbb787ff8",
	"dat://bcd539b3f4e42f03c6bbccb095b94766d833baab14e2bfa5dd4b939a3db152ef",
	"dat://c22db18fec1762331a0a09caa9cf9f73252bac6dd6e94e1e7b4fd4f45faf95cc",
	"dat://c81299cfc139791ccc6db42f0bcac8a9af590c03828e8066478fcfc60ca6e481",
	"dat://cf1c6948c28017a94f7ffbbcd836b9cc3b6e15f328cb1eec5d91fd5f7109f969",
	"dat://d899505bfa7ad0c6f0d009798fc3a8e8ad9a8d3789873529278449ad5b9a39fd",
	"dat://db7d4d96c9d9e54c1be6f93dd40ae1acf0796232a10b846e21d9606489eccc0a",
	"dat://df6ef65725699436227b88de4f134cd95af29860f4c5bc4e1bf490b76ea126c6",
	"dat://e057a99d8d375962eabea583f9b4cb0739a58852702948f606aa9921656d7a17",
	"dat://edb4710967d06749e42868896a254fb34a89c4e444a565431544530decce376f",
];

dispatch(crawlerInstance, foundLinks.create({ source: null, sinks }));

//dispatch(
//crawlerInstance,
//foundLink.create({ source: null, sink: "dat://explore.beakerbrowser.com" }),
//);

//dispatch(
//crawlerInstance,
//foundLink.create({ source: null, sink: "dat://electro.pizza/" }),
//);

//dispatch(
//crawlerInstance,
//foundLink.create({ source: null, sink: "dat://hraew.autophagy.io/" }),
//);
