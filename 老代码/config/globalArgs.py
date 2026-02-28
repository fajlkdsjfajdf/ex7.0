import sys

def parse_args(args):
    result = {}
    i = 0
    while i < len(args):
        if args[i].startswith('--'):
            words = args[i][2:].split("=")
            if len(words) == 2:
                key = words[0]
                value = words[1]
                result[key] = value
        i += 1
    return result

global_args = {}
input_args = sys.argv[1:]
global_args = parse_args(input_args)
print(global_args)
