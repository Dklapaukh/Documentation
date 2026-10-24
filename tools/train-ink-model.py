import os
os.environ['OPENBLAS_NUM_THREADS']='2'
os.environ['OMP_NUM_THREADS']='2'
from pathlib import Path
import numpy as np,json,struct,time
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score
import argparse
parser=argparse.ArgumentParser(description='Reproduce the prototype local digit model; no app build is required.')
parser.add_argument('--data',type=Path,required=True,help='Path to official MNIST mnist.npz')
parser.add_argument('--output',type=Path,default=Path('ink-model.bin'))
args=parser.parse_args()
p=args.data.parent
z=np.load(args.data);x=z['x_train'].reshape(-1,784).astype(np.float32)/255;y=z['y_train']
m=MLPClassifier(hidden_layer_sizes=(64,),batch_size=256,max_iter=24,random_state=27,early_stopping=True,n_iter_no_change=4,learning_rate_init=.001,verbose=False)
t=time.time();m.fit(x,y)
accuracy=accuracy_score(z['y_test'],m.predict(z['x_test'].reshape(-1,784).astype(np.float32)/255))
b=struct.pack('<4sIII',b'PND1',784,64,10)+b''.join(a.astype('<f4').tobytes() for a in [m.coefs_[0],m.intercepts_[0],m.coefs_[1],m.intercepts_[1]])
args.output.write_bytes(b)
meta={'source':'MNIST via official Keras dataset mirror','source_url':'https://storage.googleapis.com/tensorflow/tf-keras-datasets/mnist.npz','architecture':'784 → 64 ReLU → 10 softmax','training_examples':60000,'held_out_test_examples':10000,'held_out_test_accuracy':accuracy,'epochs':m.n_iter_,'seed':27,'seconds':round(time.time()-t,1),'scope':'Isolated MNIST digits only. NOT clinical handwriting validation.'}
args.output.with_suffix('.metadata.json').write_text(json.dumps(meta,indent=2));print(json.dumps(meta),flush=True)
