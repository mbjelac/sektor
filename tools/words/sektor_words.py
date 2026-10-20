# Writes frontend/src/assets/sektor-words.txt: the words sektor names are made of, one per line.
#
# 10000 words picked at random from the system's English word list (/usr/share/dict/words): only
# lowercase words of two letters or more, letters alone, so no proper names, and none of the filler words below, which
# say nothing of a place. Fixed seed; rerunning reproduces the file.
#
# Run from anywhere: python3 tools/words/sektor_words.py
import os
import random

SEED = 2026
WORD_COUNT = 10000
SOURCE = '/usr/share/dict/words'
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..',
                      'frontend', 'src', 'assets', 'sektor-words.txt')

# Articles, pronouns, conjunctions, auxiliaries and the like.
FILLER_WORDS = set('''
a an the and or nor but if then than so yet as because although though while whereas unless whether
i me my mine myself we us our ours ourselves you your yours yourself yourselves he him his himself
she her hers herself it its itself they them their theirs themselves this that these those
who whom whose which what whatever whoever whichever
is am are was were be been being have has had having do does did doing done
will would shall should can could may might must ought
not no yes some any each every either neither both all none such own same other another
of to at by for from with about upon unto onto into than too very just also only even
there here when where why how
'''.split())


def main():
    with open(SOURCE) as source:
        words = sorted({word.strip() for word in source
                        if len(word.strip()) >= 2 and word.strip().isalpha() and word.strip().islower() and word.strip() not in FILLER_WORDS})
    random.seed(SEED)
    picked = sorted(random.sample(words, WORD_COUNT))
    with open(OUTPUT, 'w') as output:
        output.write('\n'.join(picked) + '\n')
    print(f'{len(words)} candidate words, {len(picked)} written to {os.path.normpath(OUTPUT)}')


if __name__ == '__main__':
    main()
