#!/usr/lib/python-virtualenvs/rewad/bin/python

# change shebang according to system
###!C:/Anaconda/python.exe

# Test script: integrate bevavioral data from website to optimization
#def main(id):
# import libraries
import sys
import numpy as np                          #scientific computing
#import xlsxwriter
from scipy import optimize
import pandas as pd                         #import data
import json
# import pysnooper
import sys
#import logging

#logging.basicConfig(filename='warninglog.log', level=logging.DEBUG)
#sys.stderr = open('warning.log', 'w')

id = sys.argv[1]
#id = "4rjaihpk5"

# define necessary functions
#------------------------------------------------------------------------------
# optimize model
#@pysnooper.snoop('optimizeModelLoss.log')
def optimizeModel(delay, r1, r2, a):
    
    eps=1e-9    #precision of optimizer
    ninits=100  #number of initial conditions for optimization
    
    LL=np.ndarray((ninits,1))
    pars=np.ndarray((ninits,3)) #GK update 26/10/21
    for i in range(0,ninits):
        #draw initial conditions for optimization algo:
        betainit= np.random.uniform(low=0.001, high=2.0, size=None)
        kappainit= np.random.uniform(low=0.0, high=1000.0, size=None)
        sinit= np.random.uniform(low=0.0, high=1.0, size=None)  #GK update 26/10/21
        pars0=[betainit, kappainit, sinit] #GK update 26/10/21
            
        minimize_method='L-BFGS-B' #optimizatin method used

        ##optimization without bound
        #result=optimize.minimize(getLikelihoodHyperbolic, pars0 ,(a,r1,r2,delay), options={'eps': eps}) 
        
        #bounded optimization
        #kappabounds=np.array([0,10])
        #betabounds=np.array([0,10])
        #bnds = optimize.Bounds(betabounds, kappabounds, keep_feasible = True)

        bnds = ((0.001, 2), (0, 1000),(0,1))  #upper and lower bounds used for bounded optimization, #GK update 26/10/21
        result=optimize.minimize(fun=getNegLikelihoodModHyperboloid, 
                                x0=pars0, 
                                args=(a,r1,r2,delay), 
                                method = minimize_method, 
                                bounds = bnds,
                                options={'eps': eps}) #GK update 26/10/21
    
        pars[i,:]=result.x
        LL[i]=-getNegLikelihoodModHyperboloid(pars[i,:], a, r1, r2, delay) #GK update 26/10/21
    
    #find maximum and return best params and log likelihood
    LL[LL == float("inf")] = float("-inf") # turn positive infs to negative
    arr=np.amax(LL)
    # print(LL)
    # print(arr)
    tmp=LL==arr
    for i in range(0,len(tmp)):
        if tmp[i]:
            index=i
            print(index)
    betawin=pars[index,0]
    # print(betawin)
    kappawin=pars[index,1]
    # print(kappawin)
    swin=pars[index,2] #GK update 26/10/21

    LLwin=LL[index]
    
    return betawin, kappawin, swin, LLwin #GK update 26/10/21

##------------------------------------------------------------------------------
## get log likelihoood of hyperbolic model
##@pysnooper.snoop('getLLLoss.log')
#def getNegLikelihoodHyperbolic(pars, a, r1, r2,delay):
#    
#    beta,kappa=pars # beta= choice param, kappa= discounting param
#    T=len(a)
#
#    #model inits
#    L = np.ndarray((T,1))
#    V = np.ndarray((T,2))
#    V[:,0]=r1.transpose()                           # values for immediate choice
#    discountfact=discountfun(kappa,delay)*r2
#    V[:,1]=discountfact.transpose()                 # values for delayed choise
#                
#    #compute log-likelihood
#    for t in range(T):
#        Vt=V[t,a[t]-1]
#        V1=V[t,0]
#        V2=V[t,1]
#        
#        ebV1=np.exp(beta*V1)
#        ebV2=np.exp(beta*V2)
#        
#        L[t]=beta*Vt-np.log(np.sum(ebV1+ ebV2))
#
#    logL=np.sum(L)
#    return -logL
    
#------------------------------------------------------------------------------
#GK update 26/10/21 entire function
# get log likelihoood of modified hyperboloid model
#@pysnooper.snoop('getLLLoss.log')
def getNegLikelihoodModHyperboloid(pars, a, r1, r2,delay):
    
    beta,kappa,s=pars # beta= choice param, kappa= discounting param, s= scaling param
    T=len(a)

    #model inits
    L = np.ndarray((T,1))
    V = np.ndarray((T,2))
    V[:,0]=r1.transpose()                           # values for immediate choice
    discountfact=discountfun(kappa,delay,s)*r2
    V[:,1]=discountfact.transpose()                 # values for delayed choise
        
    #compute log-likelihood
    for t in range(T):
        Vt=V[t,a[t]-1]
        V1=V[t,0]
        V2=V[t,1]
        
        #numerical fix
        Vmax=max(V1,V2)
        V1=V1-Vmax
        V2=V2-Vmax
        Vt=Vt-Vmax
        
        ebV1=np.exp(beta*V1)
        ebV2=np.exp(beta*V2)
        
        L[t]=beta*Vt-np.log(np.sum(ebV1+ ebV2))

    logL=np.sum(L)
    return -logL



##------------------------------------------------------------------------------
## discounting function of hyperbolic model
#def discountfun(kappa, delay):
#    return 1/(1+kappa*delay)

#------------------------------------------------------------------------------
#GK update 26/10/21 entire function
# discounting function of modified hyperboloid model
def discountfun(kappa, delay, s):
    return 1/(1+kappa*pow(delay,s))


#------------------------------------------------------------------------------
# generate paradigm B based on best param estimates
def generateParadigm(delays, r2s, pars):
    
    kappa, beta, s=pars #GK update 26/10/21 

    prob_imm=[.1, .2, .3, .4, .5, .6, .7, .8, .9] #generated probabilites
       
    X, Y, Z=np.meshgrid(delays, r2s, prob_imm)
    X=X.flatten()
    Y=Y.flatten()
    Z=Z.flatten()
    trials=np.stack((X.transpose(), Y.transpose(), Z.transpose()))
    trials=trials.transpose()
    ntrials, zsp=np.shape(trials)
    
    p1=np.ndarray((ntrials,1))
    r1=np.ndarray((ntrials,1))
    r2=np.ndarray((ntrials,1))
    delay=np.ndarray((ntrials,1))
    for i in range(ntrials):
        # print(f"i = {i}")      # debug
        
        t=trials[i,0]
        # print(f"t = {t}")      # debug
              
        r2t=trials[i,1]
        # print(f"r2t = {r2t}")
        
        p1t=trials[i,2]
        # print(f"p1t = {p1t}")
        
        r1t=discountfun(kappa,t,s)*r2t + (np.log(p1t/(1-p1t)))/beta #GK update 26/10/21 
        # print(f"r1t = {r1t}")
        
        p1[i], r1[i], r2[i], delay[i]=p1t, r1t, r2t, t
        print(r1[i])

        ############ Modification
        if r2t > 0:                                                            ##### REWARD Trials
            if r1t < 0:
                t_n = t-1
                r1t_n=discountfun(kappa,t_n,s)*r2t + (np.log(p1t/(1-p1t)))/beta    #GK update 26/10/21 
                while r1t_n < 0:
                    t_n = t_n-1
                    if t_n >= min(delays):                                      # NEU: delay nicht kleiner als Minimum
                        r1t_n=discountfun(kappa,t_n,s)*r2t + (np.log(p1t/(1-p1t)))/beta #GK update 26/10/21 
                        # print(f"Step ONE: r1t_new = {r1t_n}, t = {t_n}, r2t = {r2t}, i = {i}")
                    elif t_n < min(delays):
                        r1t_n=r2t-0.01
                        t_n = min(delays)
                        # print(f"Step ONE: r1t_new = {r1t_n}, t = {t_n}, r2t = {r2t}, i = {i}")
                       
                if r1t_n < 0.01:                                            # reward mindestens 1 Cent
                    r1t_n = 0.01
                r1[i], delay[i]=r1t_n, t_n
                
            elif r1t > r2t or r1t == r2t:
                t_n = t+1
                r1t_n=discountfun(kappa,t_n, s)*r2t + (np.log(p1t/(1-p1t)))/beta #GK update 26/10/21 
                while r1t_n > r2t or r1t_n == r2t:
                    t_n = t_n+1
                    if t_n <= max(delays):
                        r1t_n=discountfun(kappa,t_n, s)*r2t + (np.log(p1t/(1-p1t)))/beta #GK update 26/10/21 
                        # print(f"Step TWO: r1t_new = {r1t_n}, t = {t_n}, r2t = {r2t}, i = {i}")
                    elif t_n > max(delays):
                        r1t_n = r2t-0.01
                        t_n = max(delays)
                        
                r1[i], delay[i]=r1t_n, t_n
            
            # immediate Options < 0.01 auffangen (Rundung in JS!)
            if r1t < 0.01:
                r1t_n = 0.01
                r1[i] = r1t_n
            
            # Differenz < 0.01 auffangen (Rundung JS!)
            if (r2t-r1t) < 0.01:
                r1t_n = r2t-0.01
                r1[i] = r1t_n
            
        elif r2t < 0:                                                         ##### LOSS Trials
            if r1t > 0:
                t_n = t-1
                r1t_n=discountfun(kappa,t_n,s)*r2t + (np.log(p1t/(1-p1t)))/beta    #GK update 26/10/21 
                while r1t_n > 0:
                    t_n = t_n-1
                    if t_n >= min(delays):                                      # NEU: delay nicht kleiner als Minimum
                        r1t_n=discountfun(kappa,t_n,s)*r2t + (np.log(p1t/(1-p1t)))/beta #GK update 26/10/21 
                        # print(f"Step THREE: r1t_new = {r1t_n}, t = {t_n}, r2t = {r2t}, i = {i}")
                    elif t_n < min(delays):
                        r1t_n=r2t+0.01
                        t_n = min(delays)
                        # print(f"Step THREE: r1t_new = {r1t_n}, t = {t_n}, r2t = {r2t}, i = {i}")
                
                if r1t_n > -0.01:                                            # loss maximal -1 Cent
                    r1t_n = -0.01
                r1[i], delay[i]=r1t_n, t_n                                    ### das Updaten der Variablen ist glaub ich hier falsch, die neuen r1s und delays sollen gespeichert werden
        
            elif r1t < r2t or r1t == r2t:
                t_n = t+1
                r1t_n=discountfun(kappa,t_n,s)*r2t + (np.log(p1t/(1-p1t)))/beta #GK update 26/10/21 
                while r1t_n < r2t or r1t_n == r2t:
                    t_n = t_n+1
                    if t_n <= max(delays):
                        r1t_n=discountfun(kappa,t_n,s)*r2t + (np.log(p1t/(1-p1t)))/beta #GK update 26/10/21 
                        # print(f"Step FOUR: r1t_new = {r1t_n}, t = {t_n}, r2t = {r2t}, i = {i}")
                    elif t_n > max(delays):
                        r1t_n = r2t+0.01
                        t_n = max(delays)
                        
                r1[i], delay[i]=r1t_n, t_n
            
            # immediate Options > -0.01 auffangen (Rundung in JS!)
            if r1t > -0.01:
                r1t_n = -0.01
                r1[i] = r1t_n
            
            # Differenz < 0.01 auffangen (Rundung JS!)
            if (r2t-r1t) > -0.01:
                r1t_n = r2t+0.01
                r1[i] = r1t_n
       
           
    return delay, r1, r2, p1

# input and output paths
rootpath = "../data/"
inputfile= f"{id}_exp1.csv"
outputfile=f"{id}_params_exp2.json"
outputfile2=f"{id}_params_exp2_z.csv"
paramsfile=f"{id}_kappa.csv"
paramsjsonfile=f"{id}_kappa.json"

# DEBUG
# sys.path.append('Y:\data\RewAD2\data\serverfiles\data')

# input file
filein= rootpath + inputfile
# DEBUG
#filein = inputfile

# output files
outputjson= rootpath + outputfile
outputxlsx= rootpath + outputfile2
outputparams = rootpath + paramsfile
paramsjson = rootpath + paramsjsonfile

# load data to pandas then convert to numpy arrays
datain = pd.read_csv(filein)
datain = datain[["immOpt", "delOpt", "delay", "choice", "task"]]

# drop missing values
datain = datain.dropna()

# replace missing values with zero
datain = datain.fillna(0)

# choice: replace "immediate" with 1 and "delayed" with 2
datain["choice_relabel"] = datain["choice"].replace({"immediate": 1,
                                                    "delayed": 2})
# split in loss and reward dfs
datain_reward = datain[datain["task"] == "reward"]
#datain_loss = datain[datain["task"] == "loss"]

### DEBUG optimizeModel ======================================================

# r1 = datain_reward[["immOpt"]].to_numpy()
# r2 = datain_reward[["delOpt"]].to_numpy()
# delay = datain_reward[["delay"]].to_numpy()
# a = datain_reward[["choice_relabel"]].to_numpy()

# r1l = datain_loss[["immOpt"]].to_numpy()
# r2l = datain_loss[["delOpt"]].to_numpy()
# delayl = datain_loss[["delay"]].to_numpy()
# al = datain_loss[["choice_relabel"]].to_numpy()

# #optimizeModel(delay, r1, r2, a)
# optimizeModel(delayl, r1l, r2l, al)

# ### DEBUG generateParadigm ===================================================
# ### ONLY FOR REWARD
# r1 = datain_reward[["immOpt"]].to_numpy()
# r2 = datain_reward[["delOpt"]].to_numpy()
# delay = datain_reward[["delay"]].to_numpy()
# a = datain_reward[["choice_relabel"]].to_numpy()

# # optimize model and return best param estimates
# beta, kappa, LL=optimizeModel(delay, r1, r2, a)
# print("inferred params: beta="+np.str(beta)+ ", kappa="+np.str(kappa)+ ", logL=" + np.str(LL))

# # generate paradigm B based on these params and given delays and rewards
# #(note: these also define the # of trials)
# pars=[kappa, beta]      
# r2s=[2, 5, 10, 20]          # define delayed rewards used for task B
# delays=[2, 7, 30, 90, 180] # define delays used for task B
# delay_B, r1_B, r2_B, p_imm = generateParadigm(delays, r2s, pars)

# End DEBUG ====================================================================

# Function to estimate parameters for each df
def estimateParameters(df, task):
    # create input arrays for functions
    r1 = df[["immOpt"]].to_numpy()
    r2 = df[["delOpt"]].to_numpy()
    delay = df[["delay"]].to_numpy()
    a = df[["choice_relabel"]].to_numpy()
    
    # optimize model and return best param estimates
    beta, kappa, s, LL=optimizeModel(delay, r1, r2, a) #GK update 26/10/21
    print("inferred params: beta="+np.str(beta)+ ", kappa="+np.str(kappa)+ ", s="+np.str(s)+ ", logL=" + np.str(LL)) #GK update 26/10/21
    
    # generate paradigm B based on these params and given delays and rewards
    #(note: these also define the # of trials)
    pars=[kappa, beta, s] #GK update 26/10/21
    if task == "reward":      
        r2s=[5, 10, 20, 50, 100]          # define delayed rewards used for task B
        delays=[7, 30, 90, 180, 365]
    else:
        r2s=[-5, -10, -20, -50]
        delays=[30, 90, 180, 365, 1095]
    delay_B, r1_B, r2_B, p_imm = generateParadigm(delays, r2s, pars)
    
    
    # generate id for trials
    trials_id = list(range(1, len(delay_B)+1))
    
    # pandas dataframe to json
    delay_B = delay_B.flatten().tolist()
    r1_B = r1_B.flatten().tolist()
    r2_B = r2_B.flatten().tolist()
    p_imm = p_imm.flatten().tolist()
    
    outdata_df = pd.DataFrame(
        {'id': trials_id,
        'immOpt': r1_B,
        'delOpt': r2_B,
        'delay': delay_B,
        'task': task,
        'p_imm': p_imm})
    
    params_df = pd.DataFrame(
        {'subject': id,
        'task': task,
        'beta': float(beta),
        'kappa': float(kappa),
        's': float(s), #GK update 26/10/21
        'LL': float(LL)},
        index=[0]
    )
    return outdata_df, params_df

# generate params for each task
outdata, params = estimateParameters(datain_reward, "reward")
#outdata_loss, params_loss = estimateParameters(datain_loss, "loss")

# convert loss values to negative
# params_loss = params_loss.assign(immOpt = -params_loss['immOpt'])
# params_loss = params_loss.assign(delOpt = -params_loss['delOpt'])


# reassign id (unique id)
outdata['id']=np.arange(len(outdata))+1
outdata = outdata.set_index('id')

# json format (exclude probabilites for json)
json_outdata = outdata.drop(['p_imm'], axis = 1)
json_outdata = outdata.to_json(orient = "index")
json_outdata = json.loads(json_outdata)

# Open a json writer, and use the json.dumps()
# function to dump data 
with open(outputjson, 'w', encoding='utf-8') as jsonf: 
    jsonf.write(json.dumps(json_outdata, indent=4)) 
    json.dumps(json_outdata, indent=4)  

# write csv with added probabilites
outdata.to_csv(outputxlsx)

# params to json
json_params = params.to_json(orient = "records")
json_params = json.loads(json_params)

# Open a json writer, and use the json.dumps()
# function to dump data 
with open(paramsjson, 'w', encoding='utf-8') as jsonf: 
    jsonf.write(json.dumps(json_params, indent=4)) 
    json.dumps(json_params, indent=4)  


# write kappa/beta to csv
params.to_csv(outputparams)

# import sys
# try:
#     with open('started.log', 'w') as f:
#         f.write(str(sys.argv))


#     main(sys.argv[1])

#     with open('finished.log', 'w') as f:
#         f.write(sys.modules.keys())
# except Exception as e:
#     with open('err.log', 'w') as f:
#         f.write(str(e) + repr(e))