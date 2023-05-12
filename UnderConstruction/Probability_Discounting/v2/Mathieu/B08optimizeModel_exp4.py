#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#including libraries
import numpy as np                          #scientific computing
import scipy as sp
import xlsxwriter
import random #GK 24.04.2023
from scipy import optimize
from IPython.core.debugger import set_trace #debugging
import pandas as pd                         #import data
#import math


# define necessary functions
#------------------------------------------------------------------------------
# optimize model
def optimizeModel(odds, r1, r2, a): 
    
    eps=1e-9    #precision of optimizer
    ninits=100  #number of initial conditions for optimization
    
    LL=np.ndarray((ninits,1))
    pars=np.ndarray((ninits,2))
    for i in range(0,ninits):
        #draw initial conditions for optimization algo:
        betainit= np.random.uniform(low=0.0, high=2.0, size=None)
        hinit= np.random.uniform(low=0.0, high=100.0, size=None) #GK check boundaries

        pars0=[betainit, hinit]
               
        minimize_method='L-BFGS-B' #optimizatin method used

        ##optimization without bound
        #result=optimize.minimize(getLikelihoodHyperbolic, pars0 ,(a,r1,r2,delay), options={'eps': eps}) 

        #bounded optimization
        bnds = ((0, 2), (0, 100))  #upper and lower bounds used for bounded optimization
        result=optimize.minimize(fun=getNegLikelihood, 
                                 x0=pars0, 
                                 args=(a,r1,r2,odds), 
                                 method = minimize_method, 
                                 bounds = bnds,
                                 options={'eps': eps}) 
    
        pars[i,:]=result.x

        LL[i]=-getNegLikelihood(pars[i,:], a, r1, r2, odds)
    
    #find maximum and return best params and log likelihood
    arr=np.amax(LL)
    tmp=LL==arr
    for i in range(0,len(tmp)):
        if tmp[i]:
            index=i
    betawin=pars[index,0]
    hwin=pars[index,1]
    LLwin=LL[index]
     
    return betawin, hwin, LLwin

#------------------------------------------------------------------------------
# get negative log likelihood of PD model
def getNegLikelihood(pars, a, r1, r2, odds):
    
    beta,hh=pars # beta= choice param, hh= discounting param
    T=len(a)

    #model inits
    L = np.ndarray((T,1))
    V = np.ndarray((T,2))
    V[:,0]=r1.transpose()                           # values for certain choice
    discountfact=discountfun(odds,hh)*r2
    V[:,1]=discountfact.transpose()                 # values for uncertain choise
        
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


#------------------------------------------------------------------------------
# discounting function of PD model
def discountfun(odds, hh):
    
    PD=1/(1+hh*odds)

    return PD

##------------------------------------------------------------------------------
## generate paradigm B based on best param estimates
#def generateParadigm(pocc, r2s, pars):
#    
#    beta,hh=pars
#
#    prob_cert=[.1, .3, .5, .7, .9] #generated probs for certain choice
#       
#    X, Y, Z=np.meshgrid(pocc, r2s, prob_cert)
#    X=X.flatten()
#    Y=Y.flatten()
#    Z=Z.flatten()
#    trials=np.stack((X.transpose(), Y.transpose(), Z.transpose()))
#    trials=trials.transpose()
#    ntrials, zsp=np.shape(trials)
#    p1=np.ndarray((ntrials,1))
#    r1=np.ndarray((ntrials,1))
#    r2=np.ndarray((ntrials,1))
#    odd=np.ndarray((ntrials,1))
#    occp=np.ndarray((ntrials,1))
#    for i in range(ntrials):
#        occpt=trials[i,0]
#        oddst=(1-occpt)/occpt
#        
#        r2t=trials[i,1]
#        p1t=trials[i,2]
#        r1t=discountfun(oddst,hh)*r2t + (np.log(p1t/(1-p1t)))/beta
#        
#        p1[i], r1[i], r2[i], odd[i], occp[i]=p1t, r1t, r2t, oddst, occpt
#        
#    return r1, r2, p1, odd, occp

#------------------------------------------------------------------------------
# generate paradigm B based on best param estimates
def generateParadigm(pocc, r1s, pars):
    
    beta,hh=pars

    prob_cert=[.3, .4, .5, .6, .7] #generated probs for certain choice
       
    X, Y, Z=np.meshgrid(pocc, r1s, prob_cert)
    X=X.flatten()
    Y=Y.flatten()
    Z=Z.flatten()
    trials=np.stack((X.transpose(), Y.transpose(), Z.transpose()))
    trials=trials.transpose()
    ntrials, zsp=np.shape(trials)
    p1=np.ndarray((ntrials,1))
    r1=np.ndarray((ntrials,1))
    r2=np.ndarray((ntrials,1))
    odd=np.ndarray((ntrials,1))
    occp=np.ndarray((ntrials,1))
    for i in range(ntrials):
        occpt=trials[i,0]
        oddst=(1-occpt)/occpt
        
        r1t=trials[i,1]
        p1t=trials[i,2]

        r2t=(r1t -(np.log(p1t/(1-p1t)))/beta)/discountfun(oddst,hh)
        
        # trial adaptation in case of reward task GK: 24.04.2023
        count=0
        if r1t>0 and (r2t < r1t):
            max_r1 = max(trials[:,1])
            
            while (r2t<r1t) and (count < 1000):
                r1t = random.randint(1, max_r1)
                r2t=(r1t -(np.log(p1t/(1-p1t)))/beta)/discountfun(oddst,hh)
                count = count +1 
                    
            if count == 1000:
                r1t=trials[i,1]
                r2t=r1t + .01
                
        # trial adaptation in case of loss task 
        if r1t<0 and (r2t > r1t):
            min_r1 = min(trials[:,1])
            
            while (r2t>r1t) and (count < 1000):
                r1t = -random.randint(1, abs(min_r1))
                r2t= r1t - .01
                count = count +1 
        # GK 24.04.2023 end (Achtung trials noch nicht randomisiert)
        
        p1[i], r1[i], r2[i], odd[i], occp[i]=p1t, r1t, r2t, oddst, occpt
        
    return r1, r2, p1, odd, occp

#---------------------------------MAIN-----------------------------------------
# input path and data file
#pati = "C:\\Users\georg\\Desktop\\TRR265\\B08\\PD_online_task\\Py\\"
pati = "C:\\Users\\georgia.koppe\\Desktop\\TRR265\\B08\\PD_online_task\\Py\\"
inputfile= "ID1111_taskA_behavior.xlsx"
outputfile='ID1111_taskB_trials_test.xlsx'
outputfile2='ID1111_taskB_trials_z.xlsx'

filein= pati + inputfile
fileout= pati + outputfile
fileout2= pati + outputfile2

print(filein)

# load data 
r1=pd.read_excel(filein, usecols=[0]).to_numpy()
r2=pd.read_excel(filein, usecols=[1]).to_numpy()
odd=pd.read_excel(filein, usecols=[2]).to_numpy()
pocc=pd.read_excel(filein, usecols=[3]).to_numpy()  
a=pd.read_excel(filein, usecols=[4]).to_numpy()    

# optimize model and return best param estimates
beta, hh, LL=optimizeModel(odd, r1, r2, a) #GK 05/12/2022
print("inferred params: beta="+str(beta)+ ", h="+ str(hh)+", logL=" + str(LL))

# generate paradigm B based on these params and given rewards and occ probs
pars=[beta, hh]      
r1s=[5, 10, 20, 50]          # define uncertain rewards used for task B
p_occ = np.array([.1, .25, .5, .75, .9])
odds = [1-p_occ]/p_occ          # define odds for task B              
r1_B, r2_B, p_cert, odds_B, occp_B = generateParadigm(p_occ, r1s, pars)

#now print to excel file for paradigm program
wb = xlsxwriter.Workbook(fileout)
ws = wb.add_worksheet('my sheet')
ws.write_row(0, 0, ['certain outcome', 'uncertain outcome', 'odds', 'poccurrence', 'pcertain'])

for i in range(len(r1_B)):
    ws.write_row(i+1, 0, [r1_B[i], r2_B[i], odds_B[i], occp_B[i], p_cert[i]]) 

wb.close()



