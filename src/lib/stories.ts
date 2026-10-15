/* A little shelf of classic, public-domain stories retold gently for bedtime.
   Everything lives in the app (no internet needed) so it always works offline. */

export interface Story {
  id: string
  title: string
  author: string
  emoji: string
  blurb: string
  minutes: number
  pages: string[]
}

export const STORIES: Story[] = [
  {
    id: 'tortoise-hare',
    title: 'The Tortoise and the Hare',
    author: 'Aesop',
    emoji: '🐢',
    blurb: 'A slow-and-steady turtle races a very speedy rabbit.',
    minutes: 3,
    pages: [
      'Once upon a time, a speedy Hare loved to boast. "I am the fastest runner in the whole forest!" he said, hopping about. "Nobody can beat me!"',
      'A quiet Tortoise heard him and smiled. "I will race you," she said, in her slow, small voice.',
      'The Hare laughed and laughed. "You? Race me? You are far too slow!" But the Tortoise only smiled and said, "We shall see."',
      'The race began. The Hare zoomed ahead in a flash and was soon far, far in front of the Tortoise.',
      'The Hare looked back and could not even see the tortoise. "I have plenty of time," he said. "I will take a little nap under this shady tree."',
      'The Tortoise kept going. Step. Step. Step. Slow and steady, never stopping, never rushing, while the rabbit snored in the shade.',
      'At last the Hare woke up and raced to the finish line — but the tortoise was already there, smiling quietly in the sun.',
      'Slow and steady wins the race. The gentle tortoise had won, and the rabbit learned that being fast is not the same as never giving up.',
    ],
  },
  {
    id: 'three-little-pigs',
    title: 'The Three Little Pigs',
    author: 'Traditional',
    emoji: '🐷',
    blurb: 'Three pigs build three houses, and one big bad wolf comes to call.',
    minutes: 4,
    pages: [
      'Three little pigs set out to build homes of their own. The first pig was in a hurry, so he built his house out of straw.',
      'The second pig built his house out of sticks. It was a little stronger, and it went up quickly.',
      'The third pig took her time. She built her house out of bricks, one brick at a time, until it was good and strong.',
      'One day the big bad wolf came along. "Little pig, little pig, let me in!" he growled at the straw house.',
      '"Not by the hair on my chinny chin chin!" said the pig. So the wolf huffed and he puffed, and he blew the straw house down.',
      'The first pig ran to the stick house. The wolf followed. "Little pigs, let me in!" But the stick house fell too.',
      'The two pigs raced to the brick house and locked the door tight. The wolf huffed and puffed, but the brick house would not budge.',
      'The wolf gave up and ran away. The three little pigs stayed safe together, and learned that it pays to take your time and do things well.',
    ],
  },
  {
    id: 'goldilocks',
    title: 'Goldilocks and the Three Bears',
    author: 'Robert Southey',
    emoji: '🐻',
    blurb: 'A curious girl visits a cottage that belongs to three bears.',
    minutes: 4,
    pages: [
      'Once there were three bears who lived in a tidy cottage in the woods: a great big Papa Bear, a middle-sized Mama Bear, and a tiny little Baby Bear.',
      'One morning their porridge was too hot to eat, so they went for a walk while it cooled.',
      'Along came a curious girl named Goldilocks. She knocked, but nobody answered, so she opened the door and went inside.',
      'On the table were three bowls of porridge. Papa Bear\u2019s was too hot, Mama Bear\u2019s was too cold, but Baby Bear\u2019s was just right, and she ate it all up.',
      'Then she found three chairs. Papa\u2019s was too big, Mama\u2019s was too soft, but Baby Bear\u2019s was just right, and it broke into pieces.',
      'Upstairs she found three beds. Papa\u2019s was too hard, Mama\u2019s was too soft, but Baby Bear\u2019s was just right, and she fell fast asleep.',
      'The three bears came home and found their porridge eaten and their chairs sat upon. "Someone has been here!" they cried.',
      'They tiptoed upstairs and found Goldilocks in Baby Bear\u2019s bed. She woke with a jump and ran all the way home, and she never snooped again.',
    ],
  },
  {
    id: 'ugly-duckling',
    title: 'The Ugly Duckling',
    author: 'Hans Christian Andersen',
    emoji: '🦢',
    blurb: 'A little duck who feels out of place grows into something beautiful.',
    minutes: 4,
    pages: [
      'On a cozy farm, a mother duck waited for her eggs to hatch. One by one they opened, until every egg had a fluffy duckling \u2014 all but the biggest egg.',
      'At last it cracked open, and out came a duckling who looked a little different from the rest. The other ducks laughed and called him the ugly duckling.',
      'The poor little duckling felt sad and lonely. He did not fit in, so one day he flew away to find a place where he belonged.',
      'He met wild ducks, and geese, and an old farm cat, but none of them felt like home. Winter came, cold and long and quiet.',
      'Spring returned, and the duckling found a pond with three beautiful white swans gliding on the water.',
      'He waited for them to chase him away, but they did not. Instead, they swam to him and welcomed him warmly.',
      'He looked down at the still water and saw his own reflection \u2014 not a scraggly duckling, but a graceful young swan, just like them.',
      'The swans told him he had always been one of them. He had only needed a little time to grow into who he truly was.',
    ],
  },
  {
    id: 'lion-mouse',
    title: 'The Lion and the Mouse',
    author: 'Aesop',
    emoji: '🦁',
    blurb: 'A tiny mouse repays a mighty lion\u2019s kindness.',
    minutes: 3,
    pages: [
      'A great lion lay sleeping in the sun when a tiny mouse ran right across his big nose.',
      'The lion woke with a start and caught the little mouse under his huge paw. "How dare you wake me!" he roared.',
      '"Please let me go," squeaked the mouse. "One day I might help you, even though I am small." The lion laughed at the idea, but he let the mouse go.',
      'Some days later, the lion was caught in a hunter\u2019s net. He struggled and roared, but the ropes held tight.',
      'The little mouse heard him and came running. With her sharp little teeth, she nibbled through the ropes, one by one.',
      'Soon the lion was free. "You were right," he said. "Even a small friend can be a great help."',
      'And from that day on, the lion and the mouse were friends, for kindness always comes back around.',
    ],
  },
  {
    id: 'red-hen',
    title: 'The Little Red Hen',
    author: 'Traditional',
    emoji: '🐔',
    blurb: 'A hardworking hen finds out who will help her make the bread.',
    minutes: 3,
    pages: [
      'Once there was a little red hen who found some grains of wheat. "Who will help me plant this wheat?" she asked.',
      '"Not I," said the cat. "Not I," said the dog. "Not I," said the duck. "Then I will," said the little red hen, and she did.',
      'The wheat grew tall and golden. "Who will help me cut the wheat?" she asked. "Not I," said the cat, the dog, and the duck.',
      '"Then I will," said the little red hen, and she did. She cut the wheat and took it to the mill to be ground into flour.',
      '"Who will help me make the bread?" she asked. Again came the same answer: "Not I, not I, not I."',
      '"Then I will," said the little red hen, and she did. She kneaded and baked until the kitchen smelled warm and sweet.',
      '"Who will help me eat the bread?" she asked. "I will! I will! I will!" cried the cat, the dog, and the duck.',
      '"Oh no," said the little red hen. "I will eat it myself." And she did \u2014 happily \u2014 because she had done all the work.',
    ],
  },
]

export function getStory(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id)
}
